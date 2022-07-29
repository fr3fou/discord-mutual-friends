package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/emicklei/dot"
)

type Relationship struct {
	ID       string  `json:"id"`
	Type     int64   `json:"type"`
	Nickname *string `json:"nickname"`
	User     User    `json:"user"`
}

type User struct {
	ID            string `json:"id"`
	Username      string `json:"username"`
	Avatar        string `json:"avatar"`
	Discriminator string `json:"discriminator"`
	PublicFlags   int64  `json:"public_flags"`
}

type UserID string

func main() {
	var token string
	fmt.Println("enter your token:")
	fmt.Scanln(&token)
	m, v, err := fetchRelationships(token)
	if err != nil {
		panic(err)
	}
	g := buildGraph(m, v)
	if err := os.WriteFile("relationships.dot", []byte(g.String()), 0644); err != nil {
		panic(err)
	}
}

func fetchRelationships(token string) (map[UserID][]UserID, []Relationship, error) {
	client := &http.Client{}
	log.Println("fetching @me relationships")
	res, err := fetchDiscordEndpoint(*client, token, "GET", "https://discordapp.com/api/v6/users/@me/relationships")
	if err != nil {
		return nil, nil, err
	}

	defer res.Body.Close()
	myRelationships := []Relationship{}
	if err := json.NewDecoder(res.Body).Decode(&myRelationships); err != nil {
		return nil, nil, err
	}

	graph := map[UserID][]UserID{}
	for _, relationship := range myRelationships {
		log.Println("fetching relationship", relationship.ID)
		res, err := fetchDiscordEndpoint(*client, token, "GET", fmt.Sprintf("https://discordapp.com/api/v6/users/%s/relationships", relationship.ID))
		if err != nil {
			return nil, nil, err
		}

		theirRelationships := []Relationship{}
		if err := json.NewDecoder(res.Body).Decode(&theirRelationships); err != nil {
			return nil, nil, err
		}

		for _, theirRelationship := range theirRelationships {
			graph[UserID(relationship.ID)] = append(graph[UserID(relationship.ID)], UserID(theirRelationship.ID))
		}
		res.Body.Close()
	}

	return graph, myRelationships, nil
}

func buildGraph(m map[UserID][]UserID, myRelationships []Relationship) *dot.Graph {
	relationships := map[UserID]User{}
	for _, v := range myRelationships {
		if v.Type != 1 {
			continue
		}

		relationships[UserID(v.ID)] = v.User
	}

	g := dot.NewGraph(dot.Directed)
	g.Attrs("concentrate", "true")
	for k, v := range m {
		if _, ok := relationships[k]; !ok {
			continue
		}

		if len(v) == 0 {
			continue
		}

		fromNode := g.Node(string(k))
		fromNode.Label(relationships[k].Username)
		for _, to := range v {
			toNode := g.Node(string(to))
			toNode.Label(relationships[to].Username)
			g.Edge(fromNode, toNode)
		}
	}
	return g
}

func fetchDiscordEndpoint(client http.Client, token, method, endpoint string) (*http.Response, error) {
	req, err := http.NewRequest(method, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("authorization", token)
	return client.Do(req)
}

package main

import (
	"encoding/json"
	"fmt"
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

func main() {
	graphFile, err := os.Open("./graph.json")
	if err != nil {
		panic(err)
	}

	relationshipsFile, err := os.Open("./relationships.json")
	if err != nil {
		panic(err)
	}

	m := map[string][]string{}
	if err := json.NewDecoder(graphFile).Decode(&m); err != nil {
		panic(err)
	}

	r := []Relationship{}
	if err := json.NewDecoder(relationshipsFile).Decode(&r); err != nil {
		panic(err)
	}

	relationships := map[string]User{}
	for _, v := range r {
		if v.Type != 1 {
			continue
		}

		relationships[v.ID] = v.User
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

		fromNode := g.Node(k)
		fromNode.Label(relationships[k].Username)
		for _, to := range v {
			toNode := g.Node(to)
			toNode.Label(relationships[to].Username)
			g.Edge(fromNode, toNode, )
		}
	}
	fmt.Println(g.String())
}

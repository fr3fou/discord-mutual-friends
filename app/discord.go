package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type User struct {
	ID            string `json:"id"`
	Username      string `json:"username"`
	GlobalName    string `json:"global_name"`
	Avatar        string `json:"avatar"`
	Discriminator string `json:"discriminator"`
	PublicFlags   int64  `json:"public_flags"`
	User          *User  `json:"user"`
}

type RateLimit struct {
	Message    string  `json:"message"`
	RetryAfter float64 `json:"retry_after"`
	Global     bool    `json:"global"`
}

type UserID string

func fetchDiscordEndpoint(token, method, endpoint string) (*http.Response, error) {
	req, err := http.NewRequest(method, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("authorization", token)
	return http.DefaultClient.Do(req)
}

func min(a time.Duration, b time.Duration) time.Duration {
	if a < b {
		return a
	}
	return b
}

func fetchMe(token string) (User, error) {
	res, err := fetchDiscordEndpoint(token, "GET", "https://discordapp.com/api/v9/users/@me")
	if err != nil {
		return User{}, err
	}

	var user User
	if err := json.NewDecoder(res.Body).Decode(&user); err != nil {
		return User{}, nil
	}
	return user, nil
}

func fetchRelationships(token string, id string) ([]User, error) {
	retries := 0
	var backOff time.Duration
	for retries < 8 {
		res, err := fetchDiscordEndpoint(token, "GET", fmt.Sprintf("https://discordapp.com/api/v9/users/%s/relationships", id))
		if err != nil {
			return nil, err
		}

		data, err := io.ReadAll(res.Body)
		if err != nil {
			return nil, err
		}
		res.Body.Close()

		var relationships []User
		if err := json.Unmarshal(data, &relationships); err == nil {
			return relationships, nil
		}

		if !bytes.Contains(data, []byte("retry_after")) {
			return nil, err
		}

		rateLimit := RateLimit{}
		if err := json.Unmarshal(data, &rateLimit); err != nil {
			return nil, err
		}

		backOff = min(backOff+time.Millisecond*100, time.Second*5)
		limit := time.Millisecond*time.Duration(rateLimit.RetryAfter*1000) + backOff
		time.Sleep(limit)
		retries++
	}
	return nil, nil
}

type Event struct {
	ID            UserID `json:"id"`
	Relationships []User `json:"relationships"`
}

func buildGraph(ctx context.Context, token string) (User, chan Event, error) {
	me, err := fetchMe(token)
	if err != nil {
		return User{}, nil, err
	}

	ch := make(chan Event)
	go func() {
		defer close(ch)
		log.Println("fetching @me relationships")
		myRelationships, err := fetchRelationships(token, "@me")
		if err != nil {
			log.Println(err)
			return
		}
		ch <- Event{ID: UserID(me.ID), Relationships: myRelationships}

		for _, relationship := range myRelationships {
			select {
			case <-ctx.Done():
				return
			default:
				log.Println("fetching relationship", relationship.ID)
				theirRelationships, err := fetchRelationships(token, relationship.ID)
				if err != nil {
					log.Println(err)
					return
				}
				ch <- Event{ID: UserID(relationship.ID), Relationships: theirRelationships}
			}
		}
	}()

	return me, ch, nil
}

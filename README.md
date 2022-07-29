# discord-mutual-friends

jank script and program for generating a .dot file for visualisation of mutual friends in Discord

![](./gephi.png)
![](./graph.png)

```console
$ go mod download 
$ go run main.go # saves to a file called relationships.dot, which can be opened using Gephi or rendered to a .svg using Dot
$ cat relationships.dot | dot -Tsvg > graph.svg # for example
```
## TODO

- [ ] Implement a Web API 
  - [ ] Login with Discord
  - [ ] Return the relationship graph from an endpoint
- [ ] Frontend
  - [ ] Login with Discord
  - [ ] Visualise the graph, interactively

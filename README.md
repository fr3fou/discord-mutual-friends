# Discord Mutual Friends




https://github.com/fr3fou/discord-mutual-friends/assets/1344906/890b1146-5829-4ac1-838f-dd665da84336




## Usage

Run the binaries from the [release page on GitHub](https://github.com/fr3fou/discord-mutual-friends/releases). Currently only macOS and Windows builds are available but will have Linux binaries soon. For now, if you're running on Linux, you can [build it yourself](#building-yourself).

After running it, you'll be greeted with the following screen:

![image](https://github.com/fr3fou/discord-mutual-friends/assets/1344906/e5b0b931-7ed8-47ba-b54e-a901c01cfff8)

In order to start the visualisation, you need to enter your personal Discord token. [Here](https://www.androidauthority.com/get-discord-token-3149920/) are some instructions on how to get it. This is used to query your relationships with your friends. Unfortunately Discord doesn't provide an (easy) way to query relationships through their public API and so this is considered self-botting. I am always open to contributions and ideas on how to improve this process. 

After entering your token and pressing start, the app will start querying your Discord friends and their mutual relationships. This might take a while depending on how many friends you have, be patient.

You can then move around the 3D space using the following controls:

- Left Click for rotating
- Mouse-wheel/Middle Click for zooming
- Right Click for panning

You can click on a friend / node and you'll focus on that user in particular – all your mutual connections with that person will be highlighted and the rest will be dimmed.

![image](https://github.com/fr3fou/discord-mutual-friends/assets/1344906/cf59ff4e-d006-4204-8726-d34a7f31a38b)

The amount of mutual connections you have someone determines their size in the 3D space.

![image](https://github.com/fr3fou/discord-mutual-friends/assets/1344906/5c433541-2ce9-4776-9887-6db9ae84076d)

Hovering on someone will show you their username.

## TODO

I'm always open to contributions and would gladly take a look at your PR if you have any improvements / ideas to the project. Here are some of the things I need help with:

- [ ] GitHub Actions Pipeline for building binaries for all platforms
- [ ] Cache the responses from the Discord API on disk so that you can start the visualisation without querying your most up-to-date friends.
- [ ] Support for reading your relationships from a Discord Data Export
  - e.g. you request your data from Discord and you can point this app to your archive/folder. This way you won't be making any HTTP calls nor would this require self botting as the app will have access to your data directly.
- [ ] More fancy graph visualisations / effects


## Building yourself

Building yourself requires having Go, Wails, Node.js installed on your system.

0. Install the wails CLI by running `./scripts/install-wails-cli.sh`
1. Install frontend dependencies using `yarn` after cd-ing into the `frontend/` folder
2. Run `wails dev` or `wails build` in the root of the project

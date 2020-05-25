# Deploying a minecraft server
In this example we create a minecraft server with just a few commands.  

As server provider normally charge you when you don't use your server or even when it's stopped, we can use clocker to spin up a new server only when we need it. clocker will save your remote minecraft world to your local machine when you stop the server and upload it again, ready to be used, when you start a new server.

We assume you are familiar with clocker, docker and how to manage a minecraft server.

## Step 1: Prepare your provider
In this example, we use [Hetzner Cloud](https://www.hetzner.com/cloud).  
It's easy to set up a free account, and their cloud servers start at a [reasonable price](https://www.hetzner.com/cloud). 

You are free to use any provider you want (and we support), it should work anyway.

Go to your [hetzner console](https://console.hetzner.cloud/projects) and create a new project called "minecraft".  
In your project, go to "Access" > "API Tokens" and generate a new token.

## Step 2: Install clocker
If you don't have clocker installed yet, open your favorite console and run `npm install -g @kay.domrose/clocker`.  
After clocker is installed, initialize it with `clocker init`.

## Step 3: Create new server
Still in your console, run `clocker add`.  
This will launch clockers server wizard, that will ask you a few questions and create a server template.

If you don't to use Hetzner Cloud, your wizard may ask you other questions, but it shouldn't be too different.

This is what i use:
- Unique id: `minecraft-server`
- Cloud server provider: **Hetzner Cloud**
- Path to ssh key: in my case its ~/.ssh/id_rsa.pub, but yours may be different
- Label for ssh: **kays-ssh**
- Label for server: **Minecraft**
- Server type: minecraft requires some resources, especially when you will have some players. I choose a **CX21** for this example.
- Hetzner Cloud API-Token: insert the api token you've created in step 1

## Step 4: Prepare data directory
clocker syncs a directory from your pc to the remote server.  
We can use that to store our minecraft locally while the server is not running.

clocker saves this data in its config directory. That's normally in `.clocker/servers/<your-server-id>/clocker-data`, with `<your-server-id>` being your unique id for the server. In my case that is `minecraft-server`, so i will use that from now on.  
It's nice to know, but in reality we should not need to visit this place at all.

In case you already have server-files you want to use, copy them to `clocker/servers/minecraft-server/clocker-data/minecraft`. 

## Step 5: Start the server
Start the server we have configured in step 2 with `clocker start minecraft-server`.

After a few minutes, the server is ready and clocker shows you its ip.  
Save the ip for later. You'll need that to connect to your minecraft server.

## Step 6: Deploy docker-compose file
Download this docker-compose file.  
It declares a service `minecraft`, using a complete [minecraft image](https://hub.docker.com/r/itzg/minecraft-server), and exposes port `25565`.

Notice how we mount a volume from `/home/worker/clocker-data/minecraft`.  
clocker will copy local files to `/home/worker/clocker-data`, with minecraft beeing a subfolder to store all the data the minecraft server is going to generate.  In there will be minecrafts `server.properties`-configuration.

In your directory where you put the compose file above, run `clocker deploy minecraft-server ./docker-compose.yml`.  

After a short time, clocker has deployed the minecraft service and mounted your data.

## Step 7: Connect
Open minecraft and add the server to your multiplayer server list.

Use the ip you got in step 5 and add port `25565`. It should look something like this: `XXX.XXX.XXX.XXX:25565`.

## Step 8: Stop the server
Once your are done playing and want to stop the server, run `clocker stop minecraft-server`.



 


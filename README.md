# Discord-portal-bot
This discord bot lets you link two channels weather be in the same server or seperate servers together.
It also includes a random channel link feature to let you link to randoms servers all around the world

## How to use
1. Invite the bot to your server using the link below
2. Use the `/link` command to link two channels together
3. Use the `/unlink` command to unlink two channels together
4. Use the `/allow-random` command to allow a channel to be linked with random channels (rerun to disallow)
5. Use the `/random` command to link a channel with a random channel (rerun to exit the random queue)
6. Use the `/help` command to get a list of all commands and their usage

## How to self host
1. Make sure you have Bun installed on your machine. You can download it from [here](https://bun.sh/).
2. Clone the repository to your local machine
3. Run `bun install` to install the dependencies
4. Create a new discord application and bot on the [discord developer portal](https://discord.com/developers/applications)
5. Copy the bot token and paste it in a `.env` file in the root of the project (use .env.example as a template)
6. Run `bun run deploy` to deploy the commands to your bot
7. Run `bun run dev` to start the bot
8. Invite the bot to your server

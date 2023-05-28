const { SlashCommandBuilder, hideLinkEmbed, bold } = require("discord.js");
const randomName = require("random-name");
const randomPhone = require("random-mobile");

const url = "https://delivery.gregoryscoffee.com/auth/email?&fulfillment=pickup";
const hiddenEmbed = hideLinkEmbed(url);
module.exports = {
  data: new SlashCommandBuilder()
    .setName("g")
    .setDescription("Free Gregory's")
    .addStringOption((option) =>
      option.setName("catchall").setDescription("Enter your catchall").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("accounts")
        .setDescription("Enter the number of account to generate")
        .setRequired(true),
    ),
  async execute(interaction) {
    await interaction.reply(`Check your DMs ${interaction.user}`);
    for (let i = 0; i < interaction.options.data[1].value; i++) {
      await genAccount(interaction.options.data[0].value);
    }
    claimed.forEach((email) => {
      interaction.user.send(email);
    });
    if (!claimed.length) {
      interaction.user.send("Something went wrong, please try again later.");
    } else {
      interaction.user.send(`${bold("Password: baruch1234")} \nOpen ${hiddenEmbed} to login.`);
    }
    claimed.length = 0;
    await interaction.reply(`Please wait 10 seconds before using this command ${interaction.user}`);
  },
};

const claimed = [];

const genOptions = (catchall) => {
  const fName = randomName.first();
  const lName = randomName.last();
  const genNumbers = () => {
    const randomNumbers = Math.floor(Math.random() * 10000).toString();
    return randomNumbers.slice(-4);
  };
  const options = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: "d0620c81eb57911f783a8545334d61d9ad8a73f56d259f3e9cac7bab8538963d",
      user: {
        email: `${fName}.${lName}${genNumbers()}@${catchall}`,
        first_name: `${fName}`,
        last_name: `${lName}`,
        password: "baruch1234",
        phone: `${randomPhone()}`,
      },
      permission_keynames: [
        "create_orders",
        "edit_user_basic_info",
        "read_user_orders",
        "read_user_basic_info",
        "manage_user_campaigns",
        "manage_user_addresses",
        "manage_user_payment_methods",
      ],
    }),
  };
  return options;
};

async function genAccount(catchall) {
  try {
    const response = await fetch("https://api.thelevelup.com/v15/apps/users", genOptions(catchall));
    const data = await response.json();
    console.log(data.user.email);
    await genReward(data.user.email);
    claimed.push(data.user.email);
  } catch (error) {
    console.log(error);
  }
}

async function genReward(email) {
  const rewardOptions = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  const formData = {
    utf8: "✓",
    cohort_code: "SWET70HY1O",
    commit: "Claim",
    email: email,
  };
  rewardOptions.body = new URLSearchParams(formData);
  try {
    await fetch("https://www.thelevelup.com/claim_for_user", rewardOptions);
  } catch (error) {
    console.log(error);
  }
}

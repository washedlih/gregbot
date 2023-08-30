const { SlashCommandBuilder, hyperlink, hideLinkEmbed, bold } = require("discord.js");
const randomName = require('random-name');
const randomPhone = require('random-mobile');

const url = "https://delivery.gregoryscoffee.com/auth/email?&fulfillment=pickup";
const hiddenEmbed = hyperlink("here", hideLinkEmbed(url));
module.exports = {
  data: new SlashCommandBuilder()
    .setName('g')
    .setDescription("Free Gregory's")
    .addStringOption((option) =>
      option.setName('catchall').setDescription('Enter your catchall').setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('accounts')
        .setDescription('Enter the number of account to generate')
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('number').setDescription('Enter your card number').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('month').setDescription('Enter your card expiration month').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('year').setDescription('Enter your card expiration year').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('cvv').setDescription('Enter your card cvv').setRequired(true)
    ),
  async execute(interaction) {
    await interaction.reply(`Check your DMs ${interaction.user}`);
    for (let i = 0; i < interaction.options.data[1].value; i++) {
      await genAccount(interaction.options.data[0].value, {
        number: interaction.options.data[2].value,
        expirationMonth: interaction.options.data[3].value,
        expirationYear: interaction.options.data[4].value,
        cvv: interaction.options.data[5].value,
      });
    }
    claimed.forEach((email) => {
      interaction.user.send(email);
    });
    if (!claimed.length) {
      interaction.user.send('Something went wrong, please try again later.');
    } else {
      interaction.user.send(bold(`Password: baruch1234 \nLogin ${hiddenEmbed}`));
    }
    claimed.length = 0;
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
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: 'd0620c81eb57911f783a8545334d61d9ad8a73f56d259f3e9cac7bab8538963d',
      user: {
        email: `${fName}.${lName}${genNumbers()}@${catchall}`,
        first_name: `${fName}`,
        last_name: `${lName}`,
        password: 'baruch1234',
        phone: `${randomPhone()}`,
      },
      permission_keynames: [
        'create_orders',
        'edit_user_basic_info',
        'read_user_orders',
        'read_user_basic_info',
        'manage_user_campaigns',
        'manage_user_addresses',
        'manage_user_payment_methods',
      ],
    }),
  };
  return options;
};

async function genAccount(catchall, card) {
  try {
    const response = await fetch('https://api.thelevelup.com/v15/apps/users', genOptions(catchall));
    const data = await response.json();
    console.log(data.user.email);
    await genReward(data.user.email);
    await addPayment(data.user.email, card);
    claimed.push(data.user.email);
  } catch (error) {
    console.log(error);
  }
}

async function genReward(email) {
  const rewardOptions = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  const formData = {
    utf8: '✓',
    cohort_code: 'SWET70HY1O',
    commit: 'Claim',
    email: email,
  };
  rewardOptions.body = new URLSearchParams(formData);
  try {
    await fetch('https://www.thelevelup.com/claim_for_user', rewardOptions);
  } catch (error) {
    console.log(error);
  }
}

async function fetchLoginToken(email) {
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'api_key': 'd0620c81eb57911f783a8545334d61d9ad8a73f56d259f3e9cac7bab8538963d',
      'username': email,
      'password': 'baruch1234',
    }),
  };
  try {
    const res = await fetch('https://api.thelevelup.com/v15/access_tokens', options);
    const data = await res.json();
    return data.access_token.token;
  } catch (error) {
    console.log(error);
  }
}

async function fetchPaymentToken(card) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Braintree-Version': '2018-05-10',
      'Authorization': 'Bearer production_s96tjg9b_n3dnp9dxqm5w34zd',
    },
    body: JSON.stringify({
      'clientSdkMetadata': {
        'source': 'client',
        'integration': 'custom',
        'sessionId': 'dce00487-1de4-4631-b14e-f65f4cbe088f',
      },
      'query':
        'mutation TokenizeCreditCard($input: TokenizeCreditCardInput!) {   tokenizeCreditCard(input: $input) {     token     creditCard {       bin       brandCode       last4       cardholderName       expirationMonth      expirationYear      binData {         prepaid         healthcare         debit         durbinRegulated         commercial         payroll         issuingBank         countryOfIssuance         productId       }     }   } }',
      'variables': {
        'input': {
          'creditCard': {
            'number': card.number,
            'expirationMonth': card.expirationMonth,
            'expirationYear': card.expirationYear,
            'cvv': card.cvv,
            'billingAddress': {
              'postalCode': card.postalCode,
            },
          },
          'options': {
            'validate': false,
          },
        },
      },
      'operationName': 'TokenizeCreditCard',
    }),
  };
  try {
    const response = await fetch('https://payments.braintree-api.com/graphql', options);
    const data = await response.json();
    return data.data.tokenizeCreditCard.token;
  } catch (error) {
    console.log(error);
  }
}

async function addPayment(email, card) {
  const loginToken = await fetchLoginToken(email);
  const paymentToken = await fetchPaymentToken({
    number: card.number,
    expirationMonth: card.expirationMonth,
    expirationYear: card.expirationYear,
    cvv: card.cvv,
    postalCode: '11365',
  });
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `token ${loginToken}`,
    },
    body: JSON.stringify({
      'credit_card': {
        'braintree_payment_nonce': paymentToken,
      },
    }),
  };
  try {
    const res = await fetch('https://api.thelevelup.com/v15/credit_cards', options);
    const data = await res.json();
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

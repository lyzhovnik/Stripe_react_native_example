import React from 'react';
import AddSubscriptionView from '../components/AddSubscriptionView';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_ww70oUQ44vVJ3HO4AnvglxCp';

/**
 * The method sends an HTTP requests to the Stripe API.
 * This method is necessary to manually send the payment data
 * to Stripe because using Stripe Elements in React Native apps
 * isn't possible.
 *
 * @param creditCardData the credit card data
 * @return Promise with the Stripe data
 */
const createCreditCardToken = (creditCardData) => {
  const card = {
    'card[number]': creditCardData.values.number.replace(/ /g, ''),
    'card[exp_month]': creditCardData.values.expiry.split('/')[0],
    'card[exp_year]': creditCardData.values.expiry.split('/')[1],
    'card[cvc]': creditCardData.values.cvc
  };

  return fetch('https://api.stripe.com/v1/tokens', {
    headers: {
      // Use the correct MIME type for your server.
      Accept: 'application/json',
      // Use a specific Content Type to send data in request body
      'Content-Type': 'application/x-www-form-urlencoded',
      // Use the Stripe publishable key as Bearer
      Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`
    },
    // Use a proper HTTP method
    method: 'post',
    // Format the credit card data to a string of key-value pairs
    // divided by &
    body: Object.keys(card)
      .map(key => key + '=' + card[key])
      .join('&')
  }).then(response => response.json());
};

/**
 * The method imitates a request to our server.
 *
 * @param creditCardToken
 * @return {Promise<Response>}
 */
const subscribeUser = (creditCardToken) => {
  return new Promise((resolve) => {
    console.log(`Credit card token: ${creditCardToken}`);
    setTimeout(() => {
      resolve({ status: true });
    }, 1000)
  });
};

/**
 * The main class that submits the credit card data and
 * handles the response from Stripe.
 */
export default class AddSubscription extends React.Component {
  static navigationOptions = {
    title: 'Add subscription',
  };

  constructor(props) {
    super(props);
    this.state = {
      submitted: false,
      error: null
    }
  }


  // Handles the tap on the Submit button
  onSubmit = async (creditCardInput) => {
    const { navigation } = this.props;
    // Disable the Submit button after the request is sent
    this.setState({ submitted: true });
    let creditCardToken;

    try {
      // Create the credit card token
      creditCardToken = await createCreditCardToken(creditCardInput);
      if (creditCardToken.error) {
        // Reset the state if Stripe responds with an error
        // Remember to set submitted to false to let the user try to subscribe again
        this.setState({ submitted: false, error: creditCardToken.error.message });
        return;
      }
    } catch (e) {
      // Reset the state if the request has nan error typically because of the credit card
      // Remember to set submitted to false to let the user try to subscribe again
      this.setState({ submitted: false, error: `Error: ${e.message}` });
      return;
    }

    // Send a request to your server with the received credit card token
    const { error } = await subscribeUser(creditCardToken);
    // Add your own logic if the server responses without errors
    if (error) {
      this.setState({ submitted: false, error: `Error: ${error.message}` });
    } else {
      this.setState({ submitted: false, error: null });
      navigation.navigate('Home')
    }
  };

  render() {
    const { submitted, error } = this.state;
    return (
        <AddSubscriptionView
          error={error}
          submitted={submitted}
          onSubmit={this.onSubmit}
        />
    );
  }
}
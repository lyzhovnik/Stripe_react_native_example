import React from 'react';

import AddSubscriptionView from '../components/AddSubscriptionView';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_ww70oUQ44vVJ3HO4AnvglxCp';

const STRIPE_ERROR = 'Payment service error. Try again later.';
const SERVER_ERROR = 'Server error. Try again later.';

/**
 * Sends the request to the Stripe api for creating credit card token.
 * This method was created to work correctly on the mobile platforms, because stripe elements designed for web only
 * and not supported on the mobile devices.
 *
 * @param creditCardInput - The credit card data.
 *
 * @return - Returns promise with the Stripe data
 */

// Sends the request to the Stripe api for creating credit card token.
const createCreditCardToken = (creditCardInput) => {
  // gets together all credit card data
  const card = {
    'card[number]': creditCardInput.values.number.replace(/ /g, ''),
    'card[exp_month]': creditCardInput.values.expiry.split('/')[0],
    'card[exp_year]': creditCardInput.values.expiry.split('/')[1],
    'card[cvc]': creditCardInput.values.cvc
  };

  return fetch('https://api.stripe.com/v1/tokens', {
    headers: {
      Accept: 'application/json',
      'Content-Type': ' application/x-www-form-urlencoded',
      Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`
    },
    method: 'post',
    // formats body to x-www-form-urlencoded format
    body: Object.keys(card)
      .map(key => key + '=' + card[key])
      .join('&')
  }).then(response => response.json());
};

/**
 * Imitates request to the server
 *
 * @param creditCardToken
 * @return {Promise<Response | never>}
 */
const addSubscription = (creditCardToken) => {
  return new Promise((resolve) => {
    console.log('creditCardTokencкreditCardTokencreditCardToken', creditCardToken);
    setTimeout(() => {
      resolve({ status: true });
    }, 1000)
  });
};

export default class AddSubscription extends React.Component {
  static navigationOptions = {
    title: 'Add subscription',
  };

  constructor(props) {
    super(props);
    this.state = {
      submitting: false,
      error: null
    }
  }


  // Handles submit the button in the credit card form
  onSubmit = async (creditCardInput) => {
    const { navigation } = this.props;
    // disable button while creating the credit card token
    this.setState({ submitting: true });
    let creditCardToken;

    try {
      // create credit card token
      creditCardToken = await createCreditCardToken(creditCardInput);
      if (creditCardToken.error) {
        // if stripe has an error, then show stripe payment service error
        this.setState({ submitting: false, error: creditCardToken.error.message });
        return;
      }
    } catch (e) {
      // if there is an error with the request, thats mean error with the credit card
      this.setState({ submitting: false, error: STRIPE_ERROR });
      return;
    }

    // Send request to the server with the credit card token
    const { errors } = await addSubscription(creditCardToken);
    // if server responses without errors then make your custom actions
    // for example redirect to another screen
    if (errors) {
      this.setState({ submitting: false, error: SERVER_ERROR });
    } else {
      this.setState({ submitting: false, error: null });
      navigation.navigate('Home')
    }
  };

  render() {
    const { submitting, error } = this.state;
    return (
        <AddSubscriptionView
          error={error}
          submitting={submitting}
          onSubmit={this.onSubmit}
        />
    );
  }
}
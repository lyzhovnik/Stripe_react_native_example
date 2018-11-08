import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import AddSubscriptionView from '../components/AddSubscriptionView';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_ww70oUQ44vVJ3HO4AnvglxCp';

const STRIPE_ERROR = 'Payment service error. Try again later.';
const CREDIT_CARD_ERROR = 'The credit card data are invalid. Please enter valid data.';
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
const createCreditCardToken = (creditCardInput) => {
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
    console.log('creditCardTokencreditCardTokencreditCardToken', creditCardToken);
    setTimeout(() => {
      resolve({ status: true });
    }, 1000)
  });
};

export default class AddSubscription extends React.Component {
  static navigationOptions = {
    title: 'Add subscription',
  };
  state = {
    card: {}
  }

  onSubmit = async (creditCardInput) => {
    const { navigation } = this.props;
    this.setState({ submitting: true });
    let creditCardToken;


    // create credit card token
    try {
      creditCardToken = await createCreditCardToken(creditCardInput);
      if (creditCardToken.error) {
        this.setState({ submitting: false, error: STRIPE_ERROR });
        return;
      }
    } catch (e) {
      this.setState({ submitting: false, error: CREDIT_CARD_ERROR });
      return;
    }




    // Send request to the server with the credit card token
    try {
      const { errors } = await addSubscription(creditCardToken);

      if (!errors) {
        this.setState({ submitting: false });
        navigation.navigate('Home');
      } else {
        this.setState({ submitting: false, error: SERVER_ERROR });
      }

    } catch (e) {
      this.setState({ submitting: false, error: SERVER_ERROR });
    }
  };

  render() {
    return (
      <ScrollView style={styles.container}>
        <AddSubscriptionView onSubmit={this.onSubmit} card={this.state.card}/>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: '#fff',
  },
});

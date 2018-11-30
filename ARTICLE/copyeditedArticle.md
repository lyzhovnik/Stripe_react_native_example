# How to Integrate Stripe into a React Native Mobile App

When you’re building a React Native app using Expo and are integrating your app with Stripe, a boilerplate to start with 
can be of good help. In this article, I provide a solution for how to implement a payment service with Stripe in a React 
Native app with full functionality. We’ve used this approach on Apollo Universal Starter Kit.

We’re going to solve the following tasks:

* Implementing a fancy design for entering the credit card data
* Validating the credit card data with `react-native-credit-card-input`
* Making a manual request to the Stripe API

For those who want to see the code in action, check out [this repository]. The approach that I'm going to describe is 
also shown in the payment module of Apollo Universal Starter Kit. 

Let’s start with the first task. We’ll focus only on the implementation.

Install a few libraries:

* `react-native-credit-card-input`
* `react-native-keyboard-spacer`

I’ll build several components: a smart component and two dumb components. In the last section, I’ll provide a solution 
to talk to the Stripe API without Stripe.js (the solution is obvious and simple, but still).

## Creating a smart component

Here we will create a smart component for adding subscription functionality. This component will render our view and 
also will have a method for submitting the form.

About the submit method in details  this method will be passed into our form `'SubscriptionCardFormView'` where we will 
call this method and pass a credit card via props.

This method will:

* create a credit card token (by the way, we create a credit card token by stripe and also stripe will send back some 
credit card information which we can safety use in our application);
* send created token and credit card into (**Important**  - which was sent back with token) to the server, and depending 
on the answer, already to be guided what to do next - show errors or for example redirect to next page.

By the way, we also provided error handling for stripe API and our server.

```javascript
import React from 'react';

import AddSubscriptionView from '../components/AddSubscriptionView';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_ww70oUQ44vVJ3HO4AnvglxCp';

const STRIPE_ERROR = 'Stripe couln\'t charge your card. Try again later or use different credit card.';
const SERVER_ERROR = 'Server error. Try again later.';

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
```

## Creating a dumb component to the manage credit card state

We’re going to create the component `'SubscriptionCardFormView'` to build the payment form. This component will be 
managing the state of the credit card, validate the card, show errors if something goes wrong after the request to 
Stripe or our server was sent, and disable the submit button after a request when we send request.

This component will also receive the following props to handle all aspects of processing the credit card:
- onSubmit, a handler that will submit the form
- submitted, a variable that will store a boolean value to disable the submit button after we sent a request
- error,an error message to show when something went wrong with the response from our server or Stripe
So here’s the implementation:
```javascript
import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { CreditCardInput } from 'react-native-credit-card-input';

import { FontAwesome } from '@expo/vector-icons';

// Renders the payment form and manages data from CreditCardInput component
export default class SubscriptionCardFormView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { cardInfo: { valid: false } };
  }

  render() {
    const { onSubmit, submitting, error } = this.props;

    return (
      <View>
        <View>
          <CreditCardInput requiresName onChange={(cardInfo) => this.setState({ cardInfo })} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title='Add subscription'
            disabled={!this.state.cardInfo.valid || submitting}
            onPress={() => onSubmit(this.state.cardInfo)}
          />
          {/* If there is an error then show it */}
          {error && (
            <View style={styles.alertWrapper}>
              <View style={styles.alertIconWrapper}>
                <FontAwesome name="exclamation-circle" size={20} style={{ color: '#c22' }} />
              </View>
              <View style={styles.alertTextWrapper}>
                <Text style={styles.alertText}>{error}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center'
  },
  buttonWrapper: {
    padding: 10,
    zIndex: 100
  },
  alertTextWrapper: {
    flex: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertIconWrapper: {
    padding: 5,
    flex: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertText: {
    color: '#c22',
    fontSize: 16,
    fontWeight: '400'
  },
  alertWrapper: {
    backgroundColor: '#ecb7b7',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 5,
    paddingVertical: 5,
    marginTop: 10
  }
});
```
## Step 3. Create a payment form.
Then we will create a component 'AddSubscriptionView'. The component below will create a view which will display the form.
```javascript
import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import KeyboardSpacer from 'react-native-keyboard-spacer';

import SubscriptionCardFormView from './SubscriptionCardFormView';

// Renders the view with the description of subscription and SubscriptionCardFormView
export default class AddSubscriptionView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} ref={ref => (this.scrollViewRef = ref)}>
          <View style={styles.textWrapper}>
            <Text style={styles.infoText}>
              This is approach for implementing stripe payment service in the react native with
              full functionality which you need for basic payment.
            </Text>
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.infoText}>
              To get a magic private number, you need to subscribe.
            </Text>
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.infoText}>
              Monthly subscription price: 10$
            </Text>
          </View>
          <View style={styles.cardFormWrapper}>
            <SubscriptionCardFormView {...this.props}/>
          </View>
        </ScrollView>
        {/* scrolls to end after focusing the credit card input field */}
        <KeyboardSpacer
          onToggle={() => { setTimeout(() => this.scrollViewRef.scrollToEnd({ animated: true }),0)} }
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  textWrapper: {
    margin: 10
  },
  infoText: {
    fontSize: 18,
    textAlign: 'center'
  },
  cardFormWrapper: {
    padding: 10,
    margin: 10
  }
});
```
## Step 4. Creating a handler to manually send requests to the Stripe API
We won’t use any addition libraries to work with Stripe because of Expo. We can’t use Stripe.js (like we would do in a React application) because we’d have to run `expo eject`, and then manage three projects – Android, iOS, and a common React Native project. But if we can’t use a prepared library, how can we send an HTTP request to Stripe? That’s quite simple, and you might have already figured it out. Nope, we aren’t going to use XMLHttpRequest (it’s not 2007 any more), we’ll use the Fetch API.
To send a request manually, we’ll need to cover four aspects:
Use the correct request string, which is `'https://api.stripe.com/v1/tokens'`
Use the correct HTTP method, POST in this case
Use the correct headers
Transform the payment data into a string to send them in the request body
As you can see, this is a very obvious solution. Let’s have a look at the code that implements it:
```javascript
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
```
Then we will extract the token and credit card data and can use it on our server in our needs. (Don't use entered credit 
card from user! It's not safe.)

## Conclusions

In this short tutorial, we’ve created a nice-looking React Native app where we can take a credit card from user with 
fancy design, also with credit card validation. Also with connection to Stripe Api without additions libraries and error 
handlers.

(For those who to actually test this solution, you’re welcome to the 
[Expo app](https://expo.io/@sysgears/apollo-universal-starter-kit)). So, yeah, sometimes the simplest idea is to use 
simple solutions (like XMLHttpRequest) and not a library.

[this repository]: https://github.com/lyzhovnik/Stripe_react_native_example
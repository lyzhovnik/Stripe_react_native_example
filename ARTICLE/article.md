# Using stripe payment service with React Native without any addition libraries.

If you are building the new app, there will probably come a time when you need to use payment service for some 
operations like charge the money for some product, or implement subscriptions for mouthly payments, and implementing a 
payment service can be not only for web, but and for mobile applications too. And if there are a lot of ready-made 
libraries for the web, but for mobile (React native) sometimes can be a nail-biter for developers, because there are 
libraries, but sometimes you cant use them (can not link them) or just don't want to import library for one request. 

In this article I am glad to introduce one good aproach for inplementing stripe payment service in the react native with 
full functionality which you need for basic pamyment. In this example I'm gonna show implementing Stripe subscription, 
but it's no matter between subscriptions (billing) or simple checkout.

So, in this tutorial will be: 
- Implementing a fancy design for entering the credit card data and also validation it with 
library `react-native-credit-card-input`;
- Making the requests for credit card token manually using the Fetch API in react native and using Stripe API without
any addition libraries.

Note: Svyat kakashka.

Notice: here we will analyze an easy example of using subscriptions on the client (native)

## Step 1. Import `react-native-credit-card-input` and create component for managing state of credit card.

At first you need to install `react-native-credit-card-input`
`npm i --save react-native-credit-card-input`.

Then we will create a component 'SubscriptionCardFormView'. This components reprehends a easy form which will be:
 - Manages state of entered credit card;
 - Validates credit card (this process `CreditCardInput` makes out og box) and disable submit button if it's not
 valid;
 - Shows errors if something goes wrong after sending request to the Stripe Api or our server;
 - Disable submit button when we send request.

This component will receive props: 
- onSubmit - function-handler for submitting the form;
- submitting - boolean variable for disabling submit button while we are sending the requests;
- error - error message if something went wrong with server or stripe API;

```javascript
import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { CreditCardInput } from 'react-native-credit-card-input';
import { FontAwesome } from '@expo/vector-icons';

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

## Step 2. Make a fancy view for displaying our credit card form and some test about subscription for example.

Then we will create a component 'AddSubscriptionView'. This components reprehends a view which will display our credit
card form and some text.

```javascript
import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import KeyboardSpacer from 'react-native-keyboard-spacer';

import SubscriptionCardFormView from './SubscriptionCardFormView';

export default class AddSubscriptionView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} ref={ref => (this.scrollViewRef = ref)}>
          <View style={styles.textWrapper}>
            <Text style={styles.infoText}>Add subscription</Text>
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.infoText}>Product description</Text>
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.infoText}>
              Price of monthly billing is 10$
            </Text>
          </View>
          <View style={styles.cardFormWrapper}>
            <SubscriptionCardFormView {...this.props}/>
          </View>
        </ScrollView>
        <KeyboardSpacer
          onToggle={() => { setTimeout(() => this.scrollViewRef.scrollToEnd({ animated: true }), 0) }}
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

## Step 3. Create main component (somethimes in the React flow it's called 'Container') for implementing main logic.

Here we will create a main component for adding subscription functionality. This component will render our view and also
will have a method for submitting the form.

About the submit method in details - this method will be passed into our form 'SubscriptionCardFormView' where we will 
call this method and pass a credit card via props. 
This method will: 
- create a credit card token (by the way, we create a credit card token by stripe and also stripe will 
send back some credit card information which we can safety use in our application);
- send created token and credit card into (**Important**  - which was sent back with token) to the server, and depending 
on the answer, already to be guided what to do next - show errors or for example redirect to next page.

By the way, we also provided error handling for stripe API and our server.

```javascript
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import AddSubscriptionView from '../components/AddSubscriptionView';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_ww70oUQ411111O4AnvglxCp';

const STRIPE_ERROR = 'Payment service error. Try again later.';
const CREDIT_CARD_ERROR = 'The credit card data are invalid. Please enter valid data.';
const SERVER_ERROR = 'Server error. Try again later.';

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
```

## Step 4. Create function for manually sending request to the Stripe API.

This is the main part of our toturial, bacause of title we will not use any addition libraries for working with the 
stripe payment.

Acordint to the [Stripe api documentation](https://stripe.com/docs/api/tokens/create_card?lang=curl) we can create a 
credit card token for curl like this: 

```blade
curl https://api.stripe.com/v1/tokens \
   -u sk_test_bEK0znXVFSiaa3AdNVYuqixL: \
   -d card[number]=4242424242424242 \
   -d card[exp_month]=12 \
   -d card[exp_year]=2019 \
   -d card[cvc]=123
```

but how to make a request via React Native Fetch? Here is solution:

```javascript
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
```

Then we will exact a token and credit card info and can use it on our server in our needs. (Don't use entered credit card 
from user! It's not safe.)

## Conclutions

In this small tutorial we just created a nice app where we can take a credit card from user with fancy design, also with 
credit card validation. Also with connection to Stripe Api without additions libraries and error handlers. 

By the way this a very small piece of real production app with stripe subscriptions. But you can see apliation with full 
basic functionallity for working with the Stripe Subbcription in our open sorce project [Starter Kit]() where we were
implemented main operations: 

* A monthly subscription plan
* Subscription cancellation
* Managing credit card details in the user profile
* Notification functionality to inform users when their subscription failed or was canceled
* Creation of subscriptions products and plans using the Stripe API from the command line
* Protection of application routes with `SubscriptionRoute` (non-subscribers are redirected)
* Authentication of subscription endpoints on the server
* Integration with [Stripe Elements in React] for the web application
* Integration with [React Native Credit Card Input] to enable Stripe subscription for mobile. The requests for credit card
token are built manually and sent using the Fetch API.
* Integration with **[stripe-local]** to query Stripe for events and to post them to the webhook endpoint

Also you can try how it's in [production demo with subscriptions](https://apollo-universal-starter-kit.herokuapp.com/)

Now you can implement stripe payments in your React Native applications! Good Luck! 
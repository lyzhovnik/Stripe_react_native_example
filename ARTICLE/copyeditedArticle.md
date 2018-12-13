When you’re building a React Native app using Expo and are going to integrate it with Stripe, you can get pain in the
neck. For example, you can't use Stripe Elements to rapidly add an appealing payment interface to your app. Second, you
also can't use the Stripe API with convenient methods to send your requests to Stripe.

Well, in practice you _can_ do all of that. But if you're going to use libraries that must be added to React Native
bundle with `react-native link`, then you first need to detach Expo and handle [a few issues].

Thankfully, you don't have to run `expo eject` (to detach the Expo project) to use Stripe in your React Native project.
I'm going to describe a very simple approach for integrating Stripe into your React Native app running with Expo (I've
used a similar approach in [Apollo Universal Starter Kit], the project I'm working on).

Here's what we'll do:

* Implementing a fancy, custom UI design
* Validating the credit card data
* Sending requests to Stripe manually

After completing the tasks, we get the following result:

<img src="" alt="Expo and React Native app with custom Stripe integration" />

If you want to see the code already, have a look at [this repository] or [the starter kit implementation] of the payment
module. If otherwise, continue to the sections below.

## Generating a React Native project

You can use Expo CLI to generate a sample React Native project. [Install the CLI] if necessary and run the following
command:

```bash
expo init
```

You'll need to answer a few questions and then you'll have a project up and running. From now on, I'll focus only on
the implementation of the components that use Stripe payments.

## Installing the libraries

Before you actually write the code, install a few libraries:

* `react-native-credit-card-input` for payment data verification
* `react-native-keyboard-spacer` for a few animations

As usual, you can use Yarn or NPM to install these libraries in your project:

```bash
# With Yarn
yarn add react-native-credit-card-input react-native-keyboard-spacer --save-dev
# or use NPM
npm install react-native-credit-card-input react-native-keyboard-spacer --save-dev
```

Once you install them, move on to the next step &mdash; creating the components.

## Creating the React Native components with Stripe

The sample application will have just three components: one component to rule them all, the smart `AddSubscription`
component, and two dumb components &mdash; `AddSubscriptionView` and `PaymentFormView` &mdash; that render the payment
form.

First, let's create the `AddSubscription` component.

### Smart component to handle Stripe in React Native app

The smart component `AddSubscription` is responsible for subscribing the user and it does the following tasks:

* It renders the `AddSubscriptionView` (dumb) component (which we have a look at in
<a href="#react-native-root-form-view-for-stripe">a later section</a>)
* It contains a function for submitting the payment form. This function will be passed into the
<a href="#payment-form-view">payment form view</a>
* It passes the application state and the submit method to the form view

Here's the `AddSubscription` implementation, which you can put in `root/src/screens/` directory:

```javascript
import React from 'react';
import AddSubscriptionView from '../components/AddSubscriptionView';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_ww70oUQ44vVJ3HO4AnvglxCp';

/**
 * The method sends HTTP requests to the Stripe API.
 * It's necessary to manually send the payment data
 * to Stripe because using Stripe Elements in React
 * Native apps isn't possible.
 *
 * @param creditCardData the credit card data
 * @return Promise with the Stripe data
 */
const getCreditCardToken = (creditCardData) => {
  const card = {
    'card[number]': creditCardData.values.number.replace(/ /g, ''),
    'card[exp_month]': creditCardData.values.expiry.split('/')[0],
    'card[exp_year]': creditCardData.values.expiry.split('/')[1],
    'card[cvc]': creditCardData.values.cvc
  };

  return fetch('https://api.stripe.com/v1/tokens', {
    headers: {
      // Use the correct MIME type for your server
      Accept: 'application/json',
      // Use the correct Content Type to send data in request body
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
    console.log('Credit card token\n', creditCardToken);
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
    title: 'Subscription page',
  };

  constructor(props) {
    super(props);
    this.state = {
      submitted: false,
      error: null
    }
  }

  // Handles submitting the payment request
  onSubmit = async (creditCardInput) => {
    const { navigation } = this.props;
    // Disable the Submit button after the request is sent
    this.setState({ submitted: true });
    let creditCardToken;

    try {
      // Create a credit card token
      creditCardToken = await getCreditCardToken(creditCardInput);
      if (creditCardToken.error) {
        // Reset the state if Stripe responds with an error
        // Set submitted to false to let the user subscribe again
        this.setState({ submitted: false, error: creditCardToken.error.message });
        return;
      }
    } catch (e) {
      // Reset the state if the request was sent with an error
      // Set submitted to false to let the user subscribe again
      this.setState({ submitted: false, error: `Error: ${e.message}` });
      return;
    }

    // Send a request to your server with the received credit card token
    const { error } = await subscribeUser(creditCardToken);
    // Handle any errors from your server
    if (error) {
      this.setState({ submitted: false, error: `Error: ${error.message}` });
    } else {
      this.setState({ submitted: false, error: null });
      navigation.navigate('Home')
    }
  };

  // render the subscription view component and pass the props to it
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
```

As you can see, there's nothing special going on in the code snippet above. The key part in the code snippet, though, is
the function `createCreditCardToken()`:

```javascript
const createCreditCardToken = (creditCardData) => {
  const card = {
      'card[number]': creditCardData.values.number.replace(/ /g, ''),
      'card[exp_month]': creditCardData.values.expiry.split('/')[0],
      'card[exp_year]': creditCardData.values.expiry.split('/')[1],
      'card[cvc]': creditCardData.values.cvc
  };

  return fetch('https://api.stripe.com/v1/tokens', {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`
    },
    method: 'post',
    body: Object.keys(card)
      .map(key => key + '=' + card[key])
      .join('&')
  }).then(response => response.json());
};
```

This function sends a typical POST request using the Fetch API. What's important is that you should send
the credit card data as a string: Stripe will yell at you with the demand to use the `application/x-www-form-urlencoded`
if you try to send data in the JSON format:

<img src="" alt="Error when sending payment data in JSON to Stripe" />

This is why you need to use the specific content type and encode the payment data in the string using `'&'` as a
delimiter.

Let's now create `AddSubscriptionView`.

### Creating the root form view

`AddSubscriptionView` is a simple view component with the layout for the entire payment component. I put the file
`AddSubscriptionView.js` into the `root/src/components` folder.

Take a look at the implementation:

```javascript
import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import PaymentFormView from './PaymentFormView';

/**
 * The class renders a view with PaymentFormView
 */
export default class AddSubscriptionView extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} ref={ref => (this.scrollViewRef = ref)}>
          <View style={styles.textWrapper}>
            <Text style={styles.infoText}>
              Try out full Stripe payment functionality in a React Native app
            </Text>
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.infoText}>
              Subscribe to see the magic number!
            </Text>
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.infoText}>
              Subscription Plan: $10/month
            </Text>
          </View>
          <View style={styles.cardFormWrapper}>
            <PaymentFormView {...this.props}/>
          </View>
        </ScrollView>
        {/* Scrolls to the payment form */}
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

Notice that the payment form &mdash; `PaymentFormView` &mdash; is actually a separate component `PaymentFormView` that
I'll show last.

### Creating the payment form component

The `PaymentFormView` component provides the layout and styles for the payment form. This component will be managing the
state of the credit card, validating the card, and displaying errors if something goes wrong after the request was sent.

Note that the Submit button will be disabled once you send a request to make sure that the user doesn't try to pay
several times.

`PaymentFormView` receives the following props from the smart component `AddSubscription` to handle all aspects of
processing the credit card:

* `onSubmit`, a handler that submits the payment data
* `submitted`, a boolean value to toggle the state for the Submit button
* `error`, an error message to show when something goes wrong

Here’s the implementation:

```javascript
import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { CreditCardInput } from 'react-native-credit-card-input';
import { FontAwesome } from '@expo/vector-icons';

/**
 * Renders the payment form and handles the credit card data
 * using the CreditCardInput component.
 */
export default class PaymentFormView extends React.Component {
  constructor(props) {
    super(props);
    this.state = { cardData: { valid: false } };
  }

  render() {
    const { onSubmit, submitted, error } = this.props;

    return (
      <View>
        <View>
          <CreditCardInput requiresName onChange={(cardData) => this.setState({ cardData })} />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title='Subscribe'
            disabled={!this.state.cardData.valid || submitted}
            onPress={() => onSubmit(this.state.cardData)}
          />
          {/* Show errors */}
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

Now you run the app and test a nice-looking Stripe-based payment form in your React Native app!

[a few issues]: #https://docs.expo.io/versions/v24.0.0/expokit/detach#you-should-not-detach-if
[apollo universal starter kit]: https://apollokit.org
[this repository]: https://github.com/lyzhovnik/Stripe_react_native_example
[the starter kit implementation]: https://github.com/sysgears/apollo-universal-starter-kit/tree/master/packages/client/src/modules/payments
[install the cli]: https://docs.expo.io/versions/latest/introduction/installation
[expo app]: https://expo.io/@sysgears/apollo-universal-starter-kit

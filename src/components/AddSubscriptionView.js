import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import KeyboardSpacer from 'react-native-keyboard-spacer';

import SubscriptionCardFormView from './SubscriptionCardFormView';

// Renders view with the description of subscription and SubscriptionCardFormView
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

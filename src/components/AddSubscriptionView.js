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

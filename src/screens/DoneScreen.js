import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, H1, P } from '../components/UI';
import { theme } from '../theme';

export default function DoneScreen({ navigation }) {
  return (
    <View style={s.wrap}>
      <View style={s.check}><Text style={s.checkMark}>✓</Text></View>
      <H1>Encounter saved</H1>
      <P style={{ textAlign: 'center', marginTop: 10 }}>
        Stored anonymously on this device. Start the next screening when ready.
      </P>
      <Button title="New screening" onPress={() => navigation.navigate('Consent')} />
      <Button title="Records & export" kind="ghost" onPress={() => navigation.navigate('Records')} />
      <Button title="Back to home" kind="ghost" onPress={() => navigation.navigate('Home')} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  check: { width: 76, height: 76, borderRadius: 38, backgroundColor: theme.ok, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  checkMark: { color: '#fff', fontSize: 38, fontWeight: '800' },
});

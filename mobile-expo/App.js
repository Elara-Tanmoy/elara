
import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, Button, View, ScrollView } from 'react-native';

const API_BASE = 'http://10.0.2.2:3001'; // Android emulator to host; change to device IP on real phone

export default function App() {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [out, setOut] = useState('');

  async function post(path, body){
    const r = await fetch(API_BASE + path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    setOut(JSON.stringify(await r.json(), null, 2));
  }

  return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView contentContainerStyle={{padding:16}}>
        <Text style={{fontSize:24, fontWeight:'600'}}>Elara Mobile</Text>
        <Text>API: {API_BASE}</Text>
        <View style={{marginTop:16}}>
          <Text>Check Link</Text>
          <TextInput value={url} onChangeText={setUrl} placeholder="https://..." style={{borderWidth:1, padding:8, borderRadius:8}} />
          <Button title="Scan Link" onPress={()=>post('/scan-link',{url})} />
        </View>
        <View style={{marginTop:16}}>
          <Text>Scan Message</Text>
          <TextInput value={text} onChangeText={setText} placeholder="Paste message" multiline style={{borderWidth:1, padding:8, borderRadius:8, minHeight:100}} />
          <Button title="Scan Message" onPress={()=>post('/scan-message',{text})} />
        </View>
        <Text style={{marginTop:16, fontFamily:'Courier'}}>Output:</Text>
        <Text selectable style={{fontFamily:'Courier', backgroundColor:'#111', color:'#0f0', padding:8, borderRadius:8}}>{out}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

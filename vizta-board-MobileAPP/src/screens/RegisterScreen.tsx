/**
 * RegisterScreen
 * New account creation via Clerk — email + password.
 * Role is assigned on the server side during the /auth/clerk-sync/ call
 * based on the invite link or default ("advertiser").
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../constants';
import { PrimaryButton } from '../components/common/PrimaryButton';
import type { AuthStackParamList } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type Step = 'form' | 'verify';

export default function RegisterScreen({ navigation }: Props) {
  const { signUp, setActive, isLoaded } = useSignUp();

  const [step,      setStep]      = useState<Step>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [code,      setCode]      = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleRegister = async () => {
    if (!isLoaded) return;
    try {
      setIsLoading(true);
      setError(null);
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email.trim().toLowerCase(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.sub}>We sent a 6-digit code to {email}</Text>

          <TextInput
            style={[styles.input, { textAlign:'center', letterSpacing: 8, fontSize: FontSize.xl }]}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={Colors.muted}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton label="Verify Email" onPress={handleVerify} isLoading={isLoading} disabled={code.length < 6} />
          <TouchableOpacity onPress={() => setStep('form')} style={{ marginTop: Spacing.lg, alignItems:'center' }}>
            <Text style={{ color: Colors.green, fontFamily: FontFamily.interSemiBold }}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS==='ios'?'padding':'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.sub}>Join Africa's billboard marketplace</Text>

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>First name</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Kuna" placeholderTextColor={Colors.muted} autoCapitalize="words" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Last name</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Doe" placeholderTextColor={Colors.muted} autoCapitalize="words" />
            </View>
          </View>

          <View>
            <Text style={styles.label}>Email address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@company.com" placeholderTextColor={Colors.muted} />
          </View>

          <View>
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Min 8 characters" placeholderTextColor={Colors.muted} />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label="Create account"
            onPress={handleRegister}
            isLoading={isLoading}
            disabled={!firstName || !lastName || !email || password.length < 8}
          />
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.white },
  scroll:  { flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing['3xl'], gap: Spacing.sm },
  heading: { fontFamily: FontFamily.nunitoExtraBold, fontSize: FontSize['2xl'], color: Colors.dark },
  sub:     { fontFamily: FontFamily.inter, fontSize: FontSize.base, color: Colors.muted, marginBottom: Spacing.md },
  form:    { gap: Spacing.base },
  nameRow: { flexDirection: 'row', gap: Spacing.sm },
  label:   { fontFamily: FontFamily.interSemiBold, fontSize: FontSize.sm, color: Colors.dark, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.base,
    fontFamily: FontFamily.inter, fontSize: FontSize.base, color: Colors.dark,
  },
  error:    { fontFamily: FontFamily.inter, fontSize: FontSize.sm, color: Colors.error, textAlign: 'center' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  loginText:{ fontFamily: FontFamily.inter, fontSize: FontSize.base, color: Colors.muted },
  loginLink:{ fontFamily: FontFamily.interSemiBold, fontSize: FontSize.base, color: Colors.green },
});

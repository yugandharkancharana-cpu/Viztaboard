/**
 * LoginScreen
 * Email/password via Clerk + Google OAuth sign-in.
 * On success → useAuth hook syncs with platform → RootNavigator redirects.
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
  StatusBar,
} from 'react-native';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../constants';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { OutlineButton } from '../components/common/OutlineButton';
import type { AuthStackParamList } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow }              = useOAuth({ strategy: 'oauth_google' });

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ── Email / password sign-in ────────────────────────────────────────────────

  const handleEmailSignIn = async () => {
    if (!isLoaded || !email || !password) return;
    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // RootNavigator watches Clerk auth state — will redirect automatically
      } else if (result.status === 'needs_second_factor') {
        // TODO: navigate to MFA screen
        setError('MFA required — TOTP screen coming soon.');
      } else {
        setError('Sign-in could not be completed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? err?.message ?? 'Sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google OAuth ────────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { createdSessionId, setActive: setActiveOAuth } = await startOAuthFlow();
      if (createdSessionId) {
        await setActiveOAuth!({ session: createdSessionId });
      }
    } catch (err: any) {
      setError(err?.message ?? 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>Vizta<Text style={styles.logoAccent}>Board</Text></Text>
          <Text style={styles.logoTag}>Africa's Billboard Marketplace</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to manage your campaigns</Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              placeholder="you@company.com"
              placeholderTextColor={Colors.muted}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TouchableOpacity onPress={() => {/* TODO: forgot password */}}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoComplete="password"
                placeholder="••••••••"
                placeholderTextColor={Colors.muted}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPass(!showPass)}
              >
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton
            label="Sign in"
            onPress={handleEmailSignIn}
            isLoading={isLoading}
            disabled={!email || !password}
            style={styles.signInBtn}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          {/* Google */}
          <OutlineButton
            label="🇬 Sign in with Google"
            onPress={handleGoogleSignIn}
            isLoading={isLoading}
          />
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.white },
  scroll: { flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing['3xl'] },

  logoArea:  { alignItems: 'center', marginBottom: Spacing['2xl'] },
  logoText:  {
    fontFamily: FontFamily.nunitoBlack,
    fontSize:   FontSize['3xl'],
    color:      Colors.green,
  },
  logoAccent:{
    color: Colors.greenDark,
  },
  logoTag: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      Colors.muted,
    marginTop:  Spacing.xs,
  },

  heading: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize['2xl'],
    color:      Colors.dark,
    marginBottom: Spacing.xs,
  },
  sub: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.base,
    color:      Colors.muted,
    marginBottom: Spacing.xl,
  },

  form:  { gap: Spacing.base },
  field: { gap: Spacing.xs },
  labelRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  fieldLabel: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.sm,
    color:      Colors.dark,
  },
  forgotLink: {
    fontFamily: FontFamily.interMedium,
    fontSize:   FontSize.sm,
    color:      Colors.green,
  },

  input: {
    borderWidth:      1.5,
    borderColor:      Colors.border,
    borderRadius:     Radius.md,
    paddingVertical:  Spacing.md,
    paddingHorizontal:Spacing.base,
    fontFamily:       FontFamily.inter,
    fontSize:         FontSize.base,
    color:            Colors.dark,
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position:  'absolute',
    right:     Spacing.base,
    top:       0,
    bottom:    0,
    justifyContent: 'center',
  },
  eyeIcon: { fontSize: 18 },

  errorText: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      Colors.error,
    textAlign:  'center',
  },

  signInBtn: { marginTop: Spacing.xs },

  dividerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginVertical: Spacing.sm,
  },
  divider:     { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      Colors.muted,
  },

  registerRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    marginTop:      Spacing['2xl'],
  },
  registerText: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.base,
    color:      Colors.muted,
  },
  registerLink: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.base,
    color:      Colors.green,
  },
});

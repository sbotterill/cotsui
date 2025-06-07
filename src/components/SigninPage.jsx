import * as React from 'react';
import { AppProvider } from '@toolpad/core/AppProvider';
import { SignInPage } from '@toolpad/core/SignInPage';
import { useTheme } from '@mui/material/styles';

const providers = [{ id: 'credentials', name: 'Email and password' }];

export default function SigninPage(props) {
  const theme = useTheme();

  const signIn = async (provider, formData) => {
    console.log(provider)
    console.log(formData)
    const promise = new Promise((resolve) => {
      setTimeout(() => {
        // const email = formData?.get('email');
        // const password = formData?.get('password');
        // console.log(`Signing in with "${provider.name}" and credentials: ${email}, ${password}`,)  
        props.setAuthorization(true)    
        // preview-start
        // resolve({
        //   type: 'CredentialsSignin',
        //   error: 'Invalid credentials.',
        // });
        // preview-end
      }, 300);
    });
    return promise;
  };
  
  return (
    // preview-start
    <AppProvider theme={theme}>
      <SignInPage
        signIn={signIn}
        providers={providers}
        slotProps={{ emailField: { autoFocus: false }, form: { noValidate: true } }}
      />
    </AppProvider>
    // preview-end
  );
}
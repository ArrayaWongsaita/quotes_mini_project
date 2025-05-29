'use server';

import { signIn } from '../next-auth/auth';

export async function signinWithCredentials(formData: FormData) {
  formData.set('redirectTo', '/test'); // Set redirectTo in formData
  formData.set('redirect', 'true'); // Set redirect to true
  await signIn('credentials', formData); // Call signIn with formData
}

// export async function updateToken(formData: FormData) {
//   await signIn('credentials', formData); // Call signIn with formData
//   console.log('Token updated successfully');
// }

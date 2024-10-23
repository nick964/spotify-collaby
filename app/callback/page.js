'use client';

import { Suspense } from 'react';
import AuthCodeComponent  from '../../components/ui/auth-code-component';

const Callback = () => {

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCodeComponent />
    </Suspense>
  );
};

export default Callback;

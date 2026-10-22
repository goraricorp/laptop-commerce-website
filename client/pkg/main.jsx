import React, {StrictMode} from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import {BrowserRouter} from 'react-router-dom';
import {GoogleOAuthProvider} from '@react-oauth/google';
import {Provider} from './context/Context.jsx';
import Scroll from "./layouts/Scroll.jsx"; // Import Provider từ Context

const CLIENT_ID = process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID; // Có thể thay bằng process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID nếu dùng dotenv

ReactDOM.createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <BrowserRouter>
    <Scroll/>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App/>
    </GoogleOAuthProvider>
  </BrowserRouter>
  // {/*</StrictMode>*/}
);

// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'
//
// createRoot(document.getElementById('root')).render(
//     <StrictMode>
//         <App />
//     </StrictMode>,
// )

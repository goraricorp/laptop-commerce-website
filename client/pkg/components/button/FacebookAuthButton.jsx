import React from 'react';
import FacebookLogin from 'react-facebook-login';

export const FacebookAuthButton = (props) => {
    const handleFacebookCallback = (response) => {
        if (response?.status === "unknown") {
            console.error('Sorry!', 'Something went wrong with facebook Login.');
            return;
        }
        console.log(response);

    }

    return (
        <FacebookLogin
            buttonStyle={{padding:"6px"}}
            appId="946726573608245"  // we need to get this from facebook developer console by setting the app.
            autoLoad={false}
            fields="name,email,picture"
            callback={handleFacebookCallback}/>
    );
};
# Talent Protocol Write Requests

## Context

Currently is possible to login with farcaster and privy, but it's not possible to write to the Talent Protocol API since an auth token is required.
The purpose of this feature is to create an authentication system that requires an user to sign a message in exchange for an auth token. The auth token should be cached by the frontend code in the browser local storage and it should automatically refresh if the user is using the app and the auth token is expiring in less than 5 days.

## Talent Protocol API authentication system docs

### Authenticate using wallet

In order to perform write requests to the protocol apps need to authenticate their users using their wallets. This is achieved by prompting them to sign a message in return of an JWT token that our API will return after successful validation.

Flow:
- User needs to have a wallet connected to your app
- You need a Talent Protocol API key with write access. You can request one API key by opening a ticket on Discord.
- Then you need to call auth/create_nonce to get a nonce that needs to be used to sign a message. Check more about it here
- After fetching the nonce the user needs to sign the following message: `Sign in with Talent Protocol\nnonce: <nonce>`. Replace <nonce> with the nonce from the previous step.
- Once you have a signed message you need to call auth/create_auth_token to get an auth token. Check more about it here
- You can then store the auth token in the browser session and use it to call endpoints that require user authentication.

Auth Tokens expire after 15 days. It's possible to refresh them by issuing a new auth token by calling auth/refresh_auth_token. . Check more about it here

Example response of /auth/create_auth_token endpoint:

```
{
  "auth": {
    "token": "string",
    "expires_at": 0
  }
}
```

Example response of /auth/create_nonce endpoint:

```
{
  "nonce": "string"
}
```

Example response of /auth/refresh_auth_token endpoint:

```
{
  "auth": {
    "token": "string",
    "expires_at": 0
  }
}
```

## Talent Protocol write endpoints

In order to perform write requests (PUT and POST) to Talent Protocol the AUTHORIZATION header needs to be passed with the following format: `Bearer <auth_token>`

### Update email

Endpoint: PUT /users

Request body example:

```
{
    "email": "string"
}
```

### Update main wallet

Endpoint: PUT /users/update_main_wallet

Request body example:

```
{
    "main_wallet_address": "string"
}
```

### Disconnect accounts

Endpoints:
    - PUT /accounts/disconnect_github
    - PUT /accounts/disconnect_twitter
    - PUT /accounts/disconnect_linkedin

No request body required. Just the auth token in the headers.

### Connect wallet to Talent Protocol

Endpoint: POST /accounts

Request body example:

```
{
    "address": "string",
    "signature": "string",
    "chain_id": "integer"
}
```

## Implementation Status

1. If a logged in user accesses the settings page and there's no talent protocol auth token the user should be prompted to sign the login message and the auth token should be stored. ✅ 
2. Integrate Talent Protocol PUT /users request to allow a user to update the email. ✅ 
3. Integrate Talent Protocol Disconnect account requests to allow a user to disconnect accounts. ✅
4. When a user logins with privy we must ask for the talent protocol auth token and store it. ✅
5. Allow users to connect new wallets using Privy and Talent Protocol POST /accounts endpoint ✅
6. Integrate GET /email_accounts endpoint from Talent Protocol to get all emails connected by the user. It requires talent auth token and should only be called when the user expands the connected emails dropdown (we need to create it) ✅

## Pending Tasks

7. Make the features above work in the farcaster mini-app. Ask to sign the talent protocol auth token with farcaster wallet.
8. Allow users to connect twitter, tiktok and instagram using Privy


# Social Media Full-Stack App

[**Link to App**](https://social-media-j6f66c4la-yeshengliu.vercel.app/)

~~[**Link to App**](https://social-media-hdsk.onrender.com/) - previous deployment on render~~

## Intro

This is a comprehensive social media web application with following functionalities

1. Make a post (text, picture, location)
1. Like or comment a post
1. Follow or search for other users
1. User Profile Page
1. Dynamic Timeline page with infinite scroll
1. Live messeage between users
1. User log in or register, showing login status

## Tech Stack

On the high level this is a **MERN** (MongoDB, Express.js, React, Node) Application, specifically I used additional libraries to achieve functionalities as stated above

[**Next.js**](https://nextjs.org/) - provide more elegant approach to build API routes and flexible server-side rendering (SSR),

[**Socket.io**](https://socket.io/) - realtime chat with multiple authenticated users

[**nookies**](https://github.com/maticzav/nookies) - cookie helper methods for Next.js

[**bcrypt.js**](https://github.com/kelektiv/node.bcrypt.js) - password encryption

[**jwt**](https://jwt.io/) - token generation

[**Semantic UI**](https://semantic-ui.com/) - CSS framework

[**NProgress.js**](https://ricostacruz.com/nprogress/) - modern looking progress bar on top of each webpage

## Guide of use

Next.js is a frontend framework in React but also add some backend features such as API route and middleware support, therefore we don't need to run frontend and backend services separately. Simply run

```
> npm run dev
```

Then the app can be accessed in your browser at `localhost:3000`

### Environment variables

You may need to specify tokens for third-party services in your `config.env` file, this includes

```
MONGO_URL=<YOUR_MONGO_URL>

jwtSecret=<YOUR_JWT_SECRET>
```

## Deploy

The application is deployed on [**render**](https://render.com/)

### Settings

**Build Command:** `yarn; yarn build`

**Start Command:** `yarn start`

### Environment variables

```
NODE_VERSION = 19.7.0
```

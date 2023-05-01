import axios from "axios";
import baseUrl from "./baseUrl";
import catchErrors from "./catchErrors";
import Router from "next/router";
import cookie from "js-cookie";

const setToken = (token) => {
  cookie.set("token", token);
  Router.push("/");
};

export const registerUser = async (
  user,
  profilePicUrl,
  setError,
  setLoading
) => {
  // Call API signup.js
  try {
    const res = await axios.post(`${baseUrl}/api/signup`, {
      user,
      profilePicUrl,
    });
    // Redirect to homepage
    setToken(res.data);
  } catch (error) {
    const errorMsg = catchErrors(error);
    setError(errorMsg);
  }
  // Deactivate loading spinner
  setLoading(false);
};

export const loginUser = async (user, setError, setLoading) => {
  // Activate loading spinner on front end
  setLoading(true);
  // Call API auth.js
  try {
    const res = await axios.post(`${baseUrl}/api/auth`, { user });
    // Redirect to homepage
    setToken(res.data);
  } catch (error) {
    const errorMsg = catchErrors(error);
    setError(errorMsg);
  }
  // Deactivate loading spinner
  setLoading(false);
};

export const redirectUser = (ctx, location) => {
  if (ctx.req) {
    // User on the server side
    ctx.res.writeHead(302, { Location: location });
    ctx.res.end();
  } else {
    // User on the client side
    Router.push(location);
  }
};

export const logoutUser = (email) => {
  cookie.set("userEmail", email);
  cookie.remove("token");
  Router.push("/login");
  Router.reload();
};

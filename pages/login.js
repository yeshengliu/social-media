import { useState, useEffect } from "react";
import { Form, Button, Message, Segment, Divider } from "semantic-ui-react";
import { loginUser } from "../utils/authUser";
import {
  HeaderMessage,
  FooterMessage,
} from "../components/Common/WelcomeMessage";
import cookie from "js-cookie";

function Login() {
  // State variables
  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const { email, password } = user;

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(true);

  // Effect hooks
  useEffect(() => {
    // activate submit button only if email and password are not empty
    const isUser = Object.values({ email, password }).every((item) =>
      Boolean(item)
    );
    isUser ? setSubmitDisabled(false) : setSubmitDisabled(true);
  }, [user]);

  useEffect(() => {
    // show Welcome Back if there exists email in browser cookie
    document.title = "Welcome Back";
    const userEmail = cookie.get("userEmail");
    if (userEmail) {
      setUser((prev) => ({ ...prev, email: userEmail }));
    }
  }, []);

  // Event handlers
  const handleChange = (e) => {
    // update user object once input field has changed
    const { name, value } = e.target;
    // push inputs into user data
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // call login API upon user clicks submit
    await loginUser(user, setErrorMsg, setFormLoading);
  };

  // HTML Components
  return (
    <>
      <HeaderMessage />

      <Form
        loading={formLoading}
        error={errorMsg !== null}
        onSubmit={handleSubmit}
      >
        <Message
          error
          header="Oops!"
          content={errorMsg}
          onDismiss={() => setErrorMsg(null)}
        />

        <Segment>
          <Form.Input
            required
            label="Email"
            placeholder="Email"
            name="email"
            value={email}
            onChange={handleChange}
            fluid
            icon="envelope"
            iconPosition="left"
            type="email"
          />

          <Form.Input
            required
            label="Password"
            placeholder="Password"
            name="password"
            value={password}
            onChange={handleChange}
            fluid
            icon={{
              name: "eye",
              circular: true,
              link: true,
              onClick: () => setShowPassword(!showPassword),
            }}
            iconPosition="left"
            type={showPassword ? "text" : "password"}
          />

          <Divider hidden />
          <Button
            content="Login"
            icon="signup"
            type="submit"
            color="orange"
            disabled={submitDisabled}
          />
        </Segment>
      </Form>

      <FooterMessage />
    </>
  );
}

export default Login;

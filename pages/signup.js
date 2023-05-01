import { useState, useEffect, useRef } from "react";
import {
  Form,
  Button,
  Message,
  Segment,
  TextArea,
  Divider,
} from "semantic-ui-react";
import SocialLinkInputs from "../components/Common/SocialLinkInputs";
import ImageDropDiv from "../components/Common/ImageDropDiv";
import {
  HeaderMessage,
  FooterMessage,
} from "../components/Common/WelcomeMessage";
import axios from "axios";
import baseUrl from "../utils/baseUrl";
import { registerUser } from "../utils/authUser";
import uploadPic from "../utils/uploadPicToCloudinary";
const regexUserName = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;
let cancelPrevUsernameCheck;

function Signup() {
  // State variables
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    facebook: "",
    youtube: "",
    twitter: "",
    instagram: "",
  });

  const { name, email, password, bio } = user;

  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(true);

  const [username, setUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);

  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [highlighted, setHighlighted] = useState(false);
  const inputRef = useRef();

  // Effect hooks
  useEffect(() => {
    // Submit button activates when selected fields are not empty
    const isUser =
      Object.values({
        name,
        email,
        password,
        bio,
      }).every((item) => Boolean(item)) && username !== "";
    isUser ? setSubmitDisabled(false) : setSubmitDisabled(true);
  }, [user, username]);

  const checkUsername = async () => {
    // Activate username loading UI spinner
    setUsernameLoading(true);
    try {
      // cancel the previous API call if exists
      cancelPrevUsernameCheck && cancelPrevUsernameCheck();

      const cancelToken = axios.CancelToken;

      const res = await axios.get(`${baseUrl}/api/signup/${username}`, {
        cancelToken: new cancelToken((canceler) => {
          cancelPrevUsernameCheck = canceler;
        }),
      });
      // clear error message
      if (errorMsg !== null) {
        setErrorMsg(null);
      }
      // push username into user object if username is available
      if (res.data === "Username available") {
        setUsernameAvailable(true);
        setUser((prev) => ({ ...prev, username }));
      }
    } catch (error) {
      setErrorMsg("Username not available");
      setUsernameAvailable(false);
    }
    setUsernameLoading(false);
  };
  // Verify username when the field changes
  useEffect(() => {
    if (username) {
      checkUsername();
    }
  }, [username]);

  // Event handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    // upload image
    let profilePicUrl;
    if (media !== null) {
      profilePicUrl = await uploadPic(media);
    }

    if (media !== null && !profilePicUrl) {
      setFormLoading(false);
      return setErrorMsg("Error uploading image");
    }
    // call API to post the user object to database
    await registerUser(user, profilePicUrl, setErrorMsg, setFormLoading);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // render upload image
    if (name === "media") {
      setMedia(files[0]);
      setMediaPreview(URL.createObjectURL(files[0]));
    }

    // push input fields into user object
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    // verify username
    if (regexUserName.test(e.target.value)) {
      setUsernameAvailable(true);
    } else {
      setUsernameAvailable(false);
    }
  };
  // HTML components
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
          <ImageDropDiv
            highlighted={highlighted}
            setHighlighted={setHighlighted}
            inputRef={inputRef}
            handleChange={handleChange}
            mediaPreview={mediaPreview}
            setMediaPreview={setMediaPreview}
            setMedia={setMedia}
          />

          <Form.Input
            required
            label="Name"
            placeholder="Name"
            name="name"
            value={name}
            onChange={handleChange}
            fluid
            icon="user"
            iconPosition="left"
          />

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

          <Form.Input
            loading={usernameLoading}
            error={!usernameAvailable}
            required
            label="Username"
            placeholder="Username"
            name="username"
            value={username}
            onChange={handleUsernameChange}
            fluid
            icon={usernameAvailable ? "check" : "close"}
            iconPosition="left"
          />

          <SocialLinkInputs
            user={user}
            showSocialLinks={showSocialLinks}
            setShowSocialLinks={setShowSocialLinks}
            handleChange={handleChange}
          />

          <Divider hidden />
          <Button
            content="Sign up"
            icon="signup"
            type="submit"
            color="orange"
            disabled={submitDisabled || !usernameAvailable}
          />
        </Segment>
      </Form>
      <FooterMessage />
    </>
  );
}

export default Signup;

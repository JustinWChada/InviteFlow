import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

function Login() {
  const { loginWithGoogle } = useAuth();

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await loginWithGoogle();

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
      }}
    >
      <h1>Login</h1>

      <button onClick={handleLogin}>Continue With Google</button>
    </div>
  );
}

export default Login;

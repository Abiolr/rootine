import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "./api";
import AuthLayout, { Field, PasswordField, SubmitButton } from "./AuthLayout";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.username.trim(), form.password); // saves the token
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title = "Welcome back"
      sub = "Log in to check on your tree."
      onSubmit = {submit}
      error = {error}
      actions = {
        <>
          <SubmitButton busy = {busy} label = "Log in" busyLabel = "Logging in..." i = {2} />
          <p className = "au-swap"> New here? <Link to = "/register"> Create an account </Link></p>
        </>
      }
    >
      <Field label = "Username" i = {0} name = "username" type = "text" autoComplete = "username" required value = {form.username} onChange = {update} />
      <PasswordField label = "Password" i = {1} name = "password" autoComplete = "current-password" required value = {form.password} onChange = {update} />
    </AuthLayout>
  );
}

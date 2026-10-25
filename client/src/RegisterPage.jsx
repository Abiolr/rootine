import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "./api";
import AuthLayout, { Field, PasswordField, SubmitButton } from "./AuthLayout";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const username = form.username.trim();
      await register(username, form.password);
      await login(username, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title = "Plant your tree"
      sub = "Create an account to set your first goals."
      onSubmit = {submit}
      error = {error}
      actions = {
        <>
          <SubmitButton busy = {busy} label = "Create an account" busyLabel = "Creating account..." i = {3} />
          <p className = "au-swap"> Already have an account? <Link to = "/login"> Log in </Link></p>
        </>
      }
    >
      <Field label = "Username" i = {0} name = "username" type = "text" autoComplete = "username" required value = {form.username} onChange = {update} />
      <PasswordField label = "Password" i = {1} name = "password" autoComplete = "new-password" required value = {form.password} onChange = {update} />
      <PasswordField label = "Confirm password" i = {2} name = "confirm" autoComplete = "new-password" required value = {form.confirm} onChange = {update} />
    </AuthLayout>
  );
}

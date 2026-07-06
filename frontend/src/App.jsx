import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.log(error);
    }

    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h2>SecureWallet</h2>

      <div>
        {!token && <Link to="/login">Login</Link>}
        {!token && <Link to="/register">Registro</Link>}

        {token && <Link to="/dashboard">Dashboard</Link>}
        {token && <Link to="/mfa">MFA</Link>}
        {token && <Link to="/admin">Admin</Link>}
        {token && <button onClick={logout}>Salir</button>}
      </div>
    </nav>
  );
}

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [mfaEmail, setMfaEmail] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [message, setMessage] = useState("");

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const login = async (e) => {
    e.preventDefault();
    setMessage("");
    setQrCodeUrl("");
    setManualCode("");

    try {
      const res = await api.post("/auth/login", form);

      if (res.data.mfaSetupRequired) {
        setMfaEmail(res.data.email || form.email);
        setQrCodeUrl(res.data.qrCodeUrl);
        setManualCode(res.data.manualCode);
        setMessage("Escanea el QR con Google Authenticator y escribe el código.");
        return;
      }

      if (res.data.mfaRequired) {
        setMfaEmail(res.data.email || form.email);
        setQrCodeUrl("");
        setManualCode("");
        setMessage("MFA requerido. Ingresa el código de Google Authenticator.");
        return;
      }

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || "Error en login");
    }
  };

  const loginMfa = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await api.post("/auth/mfa/login", {
        email: mfaEmail,
        password: form.password,
        code: mfaCode,
      });

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMfaEmail("");
      setMfaCode("");
      setQrCodeUrl("");
      setManualCode("");

      navigate("/dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || "Error MFA");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Iniciar sesión</h1>

        <form onSubmit={login}>
          <input
            name="email"
            type="email"
            placeholder="Correo"
            value={form.email}
            onChange={change}
          />

          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={change}
          />

          <button type="submit">Ingresar</button>
        </form>

        {mfaEmail && (
          <form onSubmit={loginMfa} className="mfa-box">
            {qrCodeUrl && (
              <>
                <h3>Configurar Google Authenticator</h3>
                <p>Escanea este QR con Google Authenticator.</p>

                <img src={qrCodeUrl} alt="QR MFA" className="qr" />

                <p>
                  <strong>Código manual:</strong>
                </p>

                <code>{manualCode}</code>
              </>
            )}

            <h3>Código MFA</h3>

            <input
              placeholder="Código de 6 dígitos"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
            />

            <button type="submit">Verificar MFA</button>
          </form>
        )}

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();

  const [captcha, setCaptcha] = useState(null);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    ci: "",
    email: "",
    phone: "",
    password: "",
    captchaAnswer: "",
  });

  const getCaptcha = async () => {
    try {
      const res = await api.get("/auth/captcha");
      setCaptcha(res.data);
    } catch (error) {
      setMessage("No se pudo cargar el CAPTCHA");
    }
  };

  useEffect(() => {
    getCaptcha();
  }, []);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const register = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/auth/register", {
        ...form,
        captchaId: captcha.captchaId,
      });

      setMessage("Usuario registrado correctamente");
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error al registrar");
      getCaptcha();
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Registro</h1>

        <form onSubmit={register}>
          <input
            name="fullName"
            placeholder="Nombre completo"
            value={form.fullName}
            onChange={change}
          />

          <input
            name="ci"
            placeholder="CI"
            value={form.ci}
            onChange={change}
          />

          <input
            name="email"
            type="email"
            placeholder="Correo"
            value={form.email}
            onChange={change}
          />

          <input
            name="phone"
            placeholder="Teléfono"
            value={form.phone}
            onChange={change}
          />

          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={change}
          />

          {captcha && (
            <div className="captcha">
              <strong>{captcha.question}</strong>
            </div>
          )}

          <input
            name="captchaAnswer"
            placeholder="Respuesta CAPTCHA"
            value={form.captchaAnswer}
            onChange={change}
          />

          <button type="submit">Registrarse</button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [amount, setAmount] = useState("");

  const [transfer, setTransfer] = useState({
    destinatario: "",
    monto: "",
    descripcion: "",
  });

  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");
  const [transferTotpCode, setTransferTotpCode] = useState("");

  const loadProfile = async () => {
    try {
      const res = await api.get("/me");
      setProfile(res.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error al cargar perfil");
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error al cargar historial");
    }
  };

  useEffect(() => {
    loadProfile();
    loadTransactions();
  }, []);

  const topup = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/wallet/topup", {
        amount: Number(amount),
      });

      setAmount("");
      setMessage("Recarga realizada correctamente");
      loadProfile();
      loadTransactions();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error en recarga");
    }
  };

  const createTransfer = async (e) => {
    e.preventDefault();
    setMessage("");
    setPendingTransfer(null);
    setTransferTotpCode("");

    try {
      const key = crypto.randomUUID();

      const res = await api.post(
        "/transfers",
        {
          destinatario: transfer.destinatario,
          monto: Number(transfer.monto),
          descripcion: transfer.descripcion,
        },
        {
          headers: {
            "Idempotency-Key": key,
          },
        }
      );

      setPendingTransfer(res.data);
      setMessage("Transferencia pendiente de confirmación");
    } catch (error) {
      setMessage(error.response?.data?.message || "Error en transferencia");
    }
  };

  const confirmTransfer = async () => {
    setMessage("");

    try {
      const body = {};

      if (pendingTransfer.requiere_totp) {
        body.totpCode = transferTotpCode;
      }

      await api.post(`/transfers/${pendingTransfer.uuid}/confirm`, body);

      setPendingTransfer(null);
      setTransferTotpCode("");

      setTransfer({
        destinatario: "",
        monto: "",
        descripcion: "",
      });

      setMessage("Transferencia confirmada");
      loadProfile();
      loadTransactions();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error al confirmar");
    }
  };

  return (
    <div className="container">
      <div className="grid">
        <div className="card">
          <h1>Mi billetera</h1>

          {profile && (
            <>
              <p>
                <strong>Usuario:</strong> {profile.fullName}
              </p>

              <p>
                <strong>Correo:</strong> {profile.email}
              </p>

              <p>
                <strong>Rol:</strong> {profile.role}
              </p>

              <p>
                <strong>MFA:</strong>{" "}
                {profile.mfaEnabled ? "Activo" : "Inactivo"}
              </p>

              <h2>Saldo: {profile.wallet?.balance} Bs</h2>
            </>
          )}
        </div>

        <div className="card">
          <h2>Recargar saldo</h2>

          <form onSubmit={topup}>
            <input
              type="number"
              placeholder="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button type="submit">Recargar</button>
          </form>
        </div>

        <div className="card">
          <h2>Transferencia</h2>

          <form onSubmit={createTransfer}>
            <input
              placeholder="Correo o teléfono del destinatario"
              value={transfer.destinatario}
              onChange={(e) =>
                setTransfer({ ...transfer, destinatario: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Monto"
              value={transfer.monto}
              onChange={(e) =>
                setTransfer({ ...transfer, monto: e.target.value })
              }
            />

            <input
              placeholder="Descripción"
              value={transfer.descripcion}
              onChange={(e) =>
                setTransfer({ ...transfer, descripcion: e.target.value })
              }
            />

            <button type="submit">Crear transferencia</button>
          </form>

          {pendingTransfer && (
            <div className="pending">
              <h3>Confirmar transferencia</h3>

              <p>
                <strong>Destinatario:</strong> {pendingTransfer.destinatario}
              </p>

              <p>
                <strong>Estado:</strong> {pendingTransfer.estado}
              </p>

              <p>
                <strong>Requiere TOTP:</strong>{" "}
                {pendingTransfer.requiere_totp ? "Sí" : "No"}
              </p>

              {pendingTransfer.requiere_totp && (
                <input
                  placeholder="Código Google Authenticator"
                  value={transferTotpCode}
                  onChange={(e) => setTransferTotpCode(e.target.value)}
                />
              )}

              <button onClick={confirmTransfer}>Confirmar</button>
            </div>
          )}
        </div>

        <div className="card full">
          <h2>Historial</h2>

          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Contraparte</th>
                <th>Saldo resultante</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((t) => (
                <tr key={t.uuid}>
                  <td>{new Date(t.fecha).toLocaleString()}</td>
                  <td>{t.tipo}</td>
                  <td>{t.monto}</td>
                  <td>{t.contraparte || "-"}</td>
                  <td>{t.saldo_resultante}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

function MfaPage() {
  const [qr, setQr] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const enableMfa = async () => {
    setMessage("");

    try {
      const res = await api.post("/auth/mfa/enable", {});
      setQr(res.data.qrCodeUrl);
      setManualCode(res.data.manualCode);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error al activar MFA");
    }
  };

  const verifyMfa = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/auth/mfa/verify", { code });
      setMessage("MFA activado correctamente");
    } catch (error) {
      setMessage(error.response?.data?.message || "Código inválido");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>MFA / Google Authenticator</h1>

        <button onClick={enableMfa}>Generar QR MFA</button>

        {qr && (
          <div className="mfa-box">
            <img src={qr} alt="QR MFA" className="qr" />

            <p>
              <strong>Código manual:</strong>
            </p>

            <code>{manualCode}</code>
          </div>
        )}

        <form onSubmit={verifyMfa}>
          <input
            placeholder="Código de 6 dígitos"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <button type="submit">Verificar MFA</button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

function Admin() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "No tienes permiso ADMIN");
    }
  };

  const loadLogs = async () => {
    try {
      const res = await api.get("/admin/audit-logs");
      setLogs(res.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "No tienes permiso ADMIN");
    }
  };

  const toggleBlock = async (user) => {
    try {
      await api.patch(`/admin/users/${user.uuid}/block`, {
        blocked: !user.isBlocked,
      });

      loadUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Error");
    }
  };

  useEffect(() => {
    loadUsers();
    loadLogs();
  }, []);

  return (
    <div className="container">
      <div className="card full">
        <h1>Panel administrador</h1>

        {message && <p className="message">{message}</p>}

        <h2>Usuarios</h2>

        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Saldo</th>
              <th>Bloqueado</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.uuid}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.wallet?.balance}</td>
                <td>{u.isBlocked ? "Sí" : "No"}</td>
                <td>
                  <button onClick={() => toggleBlock(u)}>
                    {u.isBlocked ? "Desbloquear" : "Bloquear"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Bitácora de auditoría</h2>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Acción</th>
              <th>Usuario</th>
              <th>IP</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{log.user?.email || "-"}</td>
                <td>{log.ip || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mfa"
          element={
            <ProtectedRoute>
              <MfaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
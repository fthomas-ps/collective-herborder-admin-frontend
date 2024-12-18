import {useState} from 'react';
import { Navigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import humps from 'humps';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Stack from '@mui/system/Stack';
import { styled } from '@mui/system';
import Box from '@mui/system/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LinearProgress from '@mui/material/LinearProgress';

const StackItem = styled('div')(({ theme }) => ({
	backgroundColor: '#fff',
	textAlign: 'left',
	borderRadius: 4,
	...theme.applyStyles('dark', {
		backgroundColor: '#262B32',
	}),
}));

export default function Login() {

	const [cookies, setCookies] = useCookies(['herbauth']);
	const [isProcessingLogin, setIsProcessingLogin] = useState(false);
	const [message, setMessage] = useState(null);
	const [showPassword, setShowPassword] = useState(false);
	const [loginCredentials, setLoginCredentials] = useState({
		username: "",
		password: ""
	});

	function login() {
		console.log("Login");
		if (isEmpty(loginCredentials.username)) {
			setMessage('Bitte gib deinen Benutzernamen ein!');
			return;
		}
		if (isEmpty(loginCredentials.password)) {
			setMessage('Bitte gib dein Passwort ein!');
			return;
		}
		setIsProcessingLogin(true);
		setMessage(<LinearProgress />);
		sendLoginRequest();
	}

	function isEmpty(s) {
		return s === null || (typeof(s) === "string" && s.trim().length === 0);
	}

	function sendLoginRequest() {
		const requestOptions = {
			method: 'POST',
			headers: {'Content-Type': 'application/json', Accept: 'application/json,application/problem+json'},
			body: JSON.stringify(humps.decamelizeKeys(loginCredentials))
		};
		fetch(process.env.REACT_APP_BACKEND_URL + '/api/admin/login', requestOptions)
		.then(response => {
			if (response.status === 204) {
				const authString = btoa(
						loginCredentials.username + ":" + loginCredentials.password);
				setCookies('herbauth', authString, { path: '/admin' });
				setMessage(<Navigate to="./orders" />);
			} else {
				throw Error();
			}
		})
		.catch(error => {
			console.log("Error: ", error);
					setMessage(<p>Bei der Anmeldung ist ein Fehler aufgetreten! Bitte überprüfe deinen Benutzernamen und das Passwort</p>);
					setIsProcessingLogin(false);
				}
		);
	}

	function onChangeUsername(event) {
		loginCredentials.username = event.target.value;
		setLoginCredentials({...loginCredentials});
	}

	function onChangePassword(event) {
		loginCredentials.password = event.target.value;
		setLoginCredentials({...loginCredentials});
	}

	function togglePasswordVisibility() {
		setShowPassword(!showPassword);
	}

	if (cookies.herbauth !== undefined) {
		return (
				<Navigate to="./orders" />
		);
	}

	return (
			<Box sx={{
				width: {xs: 1, sm: 600},
				marginTop: 9,
				marginLeft: 2,
			}}>
			<form>
				<Typography variant="h4" gutterBottom>Login</Typography>
				<Stack spacing={2}>
					<StackItem>
						<TextField
								label="Benutzername"
								variant="outlined"
								sx={{width: 1}}
								value={loginCredentials.username}
								disabled={isProcessingLogin}
								onChange={onChangeUsername}/>
					</StackItem>
					<StackItem>
						<FormControl variant="outlined" sx={{width: 1}}>
							<InputLabel htmlFor="password-field">Passwort</InputLabel>
							<OutlinedInput
									id="password-field"
									type={showPassword ? 'text' : 'password'}
									label="Passwort"
									onChange={onChangePassword}
									endAdornment={
										<InputAdornment position="end">
											<IconButton onClick={togglePasswordVisibility} edge="end">
												{showPassword ? <VisibilityOff/> : <Visibility/>}
											</IconButton>
										</InputAdornment>
									}
							/>
						</FormControl>
					</StackItem>
					<StackItem>
						<Button variant="contained" onClick={login}
										disabled={isProcessingLogin}>Anmelden</Button>
					</StackItem>
				</Stack>

					{message}
				</form>
			</Box>
	);

}

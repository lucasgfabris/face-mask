import axios from 'axios';

const API_BASE_URL = '/api';

interface RegisterResponse {
  success: boolean;
  message: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  userName?: string;
}

export const registerUser = async (
  userName: string,
  email: string,
  faceDescriptors: number[][]
): Promise<RegisterResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      userName,
      email,
      faceDescriptors,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Erro ao registrar usuário',
      };
    }
    return {
      success: false,
      message: 'Erro de conexão com o servidor',
    };
  }
};

export const authenticateUser = async (
  userName: string,
  faceDescriptor: number[]
): Promise<AuthResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      userName,
      faceDescriptor,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Erro ao autenticar usuário',
      };
    }
    return {
      success: false,
      message: 'Erro de conexão com o servidor',
    };
  }
};

export const checkUserExists = async (
  userName: string
): Promise<{ exists: boolean; message?: string }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/users`);
    if (response.data.success && response.data.users) {
      const userExists = response.data.users.some(
        (user: { userName: string }) => user.userName.toLowerCase() === userName.toLowerCase()
      );
      return {
        exists: userExists,
        message: userExists ? undefined : 'Usuário não encontrado',
      };
    }
    return { exists: false, message: 'Erro ao verificar usuário' };
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return { exists: false, message: 'Erro de conexão com o servidor' };
  }
};

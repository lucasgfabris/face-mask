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

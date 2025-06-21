import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { SafeUser, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SafeUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{ token: string }, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ token: string }, Error, InsertUser>;
  isAuthenticated: boolean;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

// Clear all old authentication data
function clearAllAuthData() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  
  // Clear any React Query cache data that might contain user info
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('user') || key.includes('auth') || key.includes('User'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Clear any old authentication data on initialization but preserve valid tokens
  useEffect(() => {
    try {
      const currentToken = localStorage.getItem('auth_token');
      console.log('Initializing auth provider, current token exists:', !!currentToken);
      
      // Aggressively clear ALL localStorage keys that might contain user data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== 'auth_token') {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log('Removing localStorage key:', key);
        localStorage.removeItem(key);
      });
      
      if (currentToken && currentToken.startsWith('eyJ')) {
        // Restore valid JWT token
        localStorage.setItem('auth_token', currentToken);
        console.log('JWT token preserved');
      }
    } catch (error) {
      console.error('Error during auth initialization:', error);
    }
  }, []);

  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<SafeUser | null, Error>({
    queryKey: ["/api/auth/verify"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('auth_token');
        console.log('User query - token exists:', !!token);
        if (!token) {
          return null;
        }
        
        // Check if token is valid JWT format
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.log('Invalid JWT format, clearing auth data');
          clearAllAuthData();
          setIsAuthenticated(false);
          return null;
        }
        
        console.log('Making API request to verify token...');
        const res = await apiRequest("GET", "/api/auth/verify");
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        if (data && data.user && typeof data.user === 'object' && data.user.id) {
          console.log('User verification successful:', data.user.username, data.user.role);
          setIsAuthenticated(true);
          return data.user;
        } else {
          console.log('Invalid response from auth verify:', data);
          clearAllAuthData();
          setIsAuthenticated(false);
          return null;
        }
      } catch (error) {
        console.log('Token verification failed:', error);
        // Token is invalid or expired, clear all auth data
        clearAllAuthData();
        setIsAuthenticated(false);
        return null;
      }
    },
    retry: false,
    enabled: !!localStorage.getItem('auth_token'),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const hasValidToken = !!localStorage.getItem('auth_token');
    const hasUser = !!user;
    const hasOldUserData = !!localStorage.getItem('currentUser');
    
    console.log('Auth effect - state:', { hasValidToken, hasUser, hasOldUserData, user });
    
    // Clear any old authentication data immediately
    if (hasOldUserData) {
      console.log('Clearing old user data from localStorage');
      clearAllAuthData();
      setIsAuthenticated(false);
      return;
    }
    
    // If no user but token exists, token is invalid - clear it
    if (!hasUser && hasValidToken) {
      console.log('Token exists but no user, clearing auth data');
      clearAllAuthData();
      setIsAuthenticated(false);
    } else {
      console.log('Setting authentication state:', hasUser);
      setIsAuthenticated(hasUser);
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Starting login mutation with credentials:', credentials.username);
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await res.json();
      console.log('Login response received:', data);
      
      // Store JWT token securely
      if (data && data.token) {
        localStorage.setItem('auth_token', data.token);
        console.log('Token stored in localStorage:', data.token.substring(0, 20) + '...');
      } else {
        console.error('No token in login response:', data);
      }
      
      return data;
    },
    onSuccess: (data: { token: string }) => {
      console.log('Login mutation success, refetching user...');
      setIsAuthenticated(true);
      // Use a small delay to ensure token is saved before refetch
      setTimeout(() => {
        console.log('Triggering user refetch...');
        refetchUser().then(() => {
          console.log('User refetch completed');
        }).catch((error) => {
          console.error('User refetch failed:', error);
        });
      }, 50);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      const data = await res.json();
      
      // Store JWT token securely
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      return data;
    },
    onSuccess: (data: { token: string }) => {
      // Cache removed to prevent localStorage pollution
      setIsAuthenticated(true);
      refetchUser();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Just remove the token from localStorage
      localStorage.removeItem('auth_token');
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/verify"], null);
      setIsAuthenticated(false);
      queryClient.clear();
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
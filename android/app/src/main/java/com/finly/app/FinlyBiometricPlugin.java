package com.finly.app;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "FinlyBiometric")
public class FinlyBiometricPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            BiometricManager biometricManager = BiometricManager.from(getContext());
            int canAuthenticate = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK
            );

            switch (canAuthenticate) {
                case BiometricManager.BIOMETRIC_SUCCESS:
                    ret.put("isAvailable", true);
                    ret.put("hasEnrolledBiometrics", true);
                    ret.put("code", "SUCCESS");
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                    ret.put("isAvailable", true);
                    ret.put("hasEnrolledBiometrics", false);
                    ret.put("code", "NONE_ENROLLED");
                    ret.put("reason", "Nenhuma biometria cadastrada no dispositivo.");
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                    ret.put("isAvailable", false);
                    ret.put("hasEnrolledBiometrics", false);
                    ret.put("code", "NO_HARDWARE");
                    ret.put("reason", "Sensor biométrico não encontrado.");
                    break;
                case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                    ret.put("isAvailable", false);
                    ret.put("hasEnrolledBiometrics", false);
                    ret.put("code", "HW_UNAVAILABLE");
                    ret.put("reason", "Hardware biométrico indisponível no momento.");
                    break;
                default:
                    ret.put("isAvailable", false);
                    ret.put("hasEnrolledBiometrics", false);
                    ret.put("code", "UNKNOWN");
                    ret.put("reason", "Status biométrico desconhecido: " + canAuthenticate);
                    break;
            }
        } catch (Exception e) {
            ret.put("isAvailable", false);
            ret.put("hasEnrolledBiometrics", false);
            ret.put("error", e.getMessage());
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                BiometricManager biometricManager = BiometricManager.from(getContext());
                int canAuthenticate = biometricManager.canAuthenticate(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK
                );

                if (canAuthenticate != BiometricManager.BIOMETRIC_SUCCESS) {
                    JSObject err = new JSObject();
                    err.put("success", false);
                    err.put("error", "Biometria não disponível ou nenhuma digital cadastrada.");
                    call.resolve(err);
                    return;
                }

                String title = call.getString("title", "Finly");
                String subtitle = call.getString("subtitle", "Toque no sensor para desbloquear");
                String description = call.getString("description", "Autenticação biométrica");
                String negativeButtonText = call.getString("negativeButtonText", "Cancelar");

                Executor executor = ContextCompat.getMainExecutor(getContext());
                FragmentActivity activity = (FragmentActivity) getActivity();

                BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor, new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        super.onAuthenticationError(errorCode, errString);
                        JSObject ret = new JSObject();
                        ret.put("success", false);
                        ret.put("error", errString.toString());
                        ret.put("errorCode", errorCode);
                        call.resolve(ret);
                    }

                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        super.onAuthenticationSucceeded(result);
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        call.resolve(ret);
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        super.onAuthenticationFailed();
                        // Unrecognized attempt; keep prompt open for user retry
                    }
                });

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title)
                    .setSubtitle(subtitle)
                    .setDescription(description)
                    .setNegativeButtonText(negativeButtonText)
                    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK)
                    .build();

                biometricPrompt.authenticate(promptInfo);

            } catch (Exception e) {
                JSObject err = new JSObject();
                err.put("success", false);
                err.put("error", e.getMessage());
                call.resolve(err);
            }
        });
    }
}

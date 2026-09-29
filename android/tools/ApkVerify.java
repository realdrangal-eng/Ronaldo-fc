import com.android.apksig.ApkVerifier;

import java.io.File;
import java.security.cert.X509Certificate;
import java.util.List;

/**
 * Verifies a built APK's signature the same way the Android package manager
 * does, using Google's apksig library.
 *
 * Usage: ApkVerify <apk> <minSdk>
 */
public class ApkVerify {

    public static void main(String[] args) throws Exception {
        if (args.length != 2) {
            System.err.println("usage: ApkVerify <apk> <minSdk>");
            System.exit(2);
        }

        File apk = new File(args[0]);
        int minSdk = Integer.parseInt(args[1]);

        ApkVerifier.Result result = new ApkVerifier.Builder(apk)
            .setMinCheckedPlatformVersion(minSdk)
            .build()
            .verify();

        for (ApkVerifier.IssueWithParams w : result.getWarnings()) {
            System.out.println("warning: " + w);
        }

        if (!result.isVerified()) {
            for (ApkVerifier.IssueWithParams e : result.getErrors()) {
                System.err.println("error: " + e);
            }
            System.err.println("SIGNATURE VERIFICATION FAILED");
            System.exit(1);
        }

        List<X509Certificate> certs = result.getSignerCertificates();
        System.out.println("signature verified"
            + "  v1=" + result.isVerifiedUsingV1Scheme()
            + "  v2=" + result.isVerifiedUsingV2Scheme()
            + "  minSdk=" + minSdk);
        for (X509Certificate cert : certs) {
            System.out.println("signer: " + cert.getSubjectX500Principal());
        }
    }
}

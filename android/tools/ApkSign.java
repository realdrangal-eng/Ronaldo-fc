import com.android.apksig.ApkSigner;

import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Adds a v2 (APK Signature Scheme) signature using Google's apksig library.
 * v2 is what lets the package install on Android 11+ when the app targets API
 * 30 or above. See android/build.sh for why this build is v2-only.
 *
 * Usage: ApkSign <in.apk> <out.apk> <keystore> <storePass> <alias> <keyPass> <minSdk>
 */
public class ApkSign {

    public static void main(String[] args) throws Exception {
        if (args.length != 7) {
            System.err.println(
                "usage: ApkSign <in.apk> <out.apk> <keystore> <storePass> <alias> <keyPass> <minSdk>");
            System.exit(2);
        }

        File in = new File(args[0]);
        File out = new File(args[1]);
        String storePath = args[2];
        char[] storePass = args[3].toCharArray();
        String alias = args[4];
        char[] keyPass = args[5].toCharArray();
        int minSdk = Integer.parseInt(args[6]);

        KeyStore ks = KeyStore.getInstance("PKCS12");
        FileInputStream ksIn = new FileInputStream(storePath);
        try {
            ks.load(ksIn, storePass);
        } finally {
            ksIn.close();
        }

        PrivateKey key = (PrivateKey) ks.getKey(alias, keyPass);
        if (key == null) {
            throw new IllegalStateException("no private key for alias '" + alias + "'");
        }

        java.security.cert.Certificate[] chain = ks.getCertificateChain(alias);
        List<X509Certificate> certs = new ArrayList<X509Certificate>();
        for (int i = 0; i < chain.length; i++) {
            certs.add((X509Certificate) chain[i]);
        }

        ApkSigner.SignerConfig signer =
            new ApkSigner.SignerConfig.Builder("CERT", key, certs).build();

        ApkSigner apkSigner = new ApkSigner.Builder(Collections.singletonList(signer))
            .setInputApk(in)
            .setOutputApk(out)
            .setMinSdkVersion(minSdk)
            .setV1SigningEnabled(false)   // v2-only; see android/build.sh
            .setV2SigningEnabled(true)
            .setOtherSignersSignaturesPreserved(false)
            .setCreatedBy("ronaldo-fc-build")
            .build();

        apkSigner.sign();

        System.out.println("v2 signature added: " + out.getName() + "  " + out.length() + " bytes");
    }
}

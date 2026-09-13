/* 알림용 열쇠 한 쌍 만들기
   쓰는 법: 이 폴더에서  node scripts/make-vapid.mjs
   나오는 두 줄을 Supabase Edge Function Secrets 에 그대로 넣으시면 됩니다.
   ⚠️ 비밀키(VAPID_PRIVATE)는 아무 데도 올리지 마세요. 저장소·메모장·카톡 금지입니다. */
import { generateKeyPairSync } from 'node:crypto';

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const der = publicKey.export({ type: 'spki', format: 'der' });

console.log('');
console.log('VAPID_PUBLIC  =', der.subarray(der.length - 65).toString('base64url'));
console.log('VAPID_PRIVATE =', privateKey.export({ format: 'jwk' }).d);
console.log('');
console.log('※ 위 두 줄을 Supabase → Edge Functions → Secrets 에 넣으세요.');
console.log('※ 이 창을 닫으면 다시 볼 수 없습니다. 열쇠를 잃어버리면 새로 만들고');
console.log('   앱에서 알림을 껐다 켜면 됩니다(기록은 아무 영향 없습니다).');

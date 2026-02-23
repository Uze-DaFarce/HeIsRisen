## 2024-05-24 - [Slider and Settings UX]
**Learning:** Phaser 3's `setInteractive` on shapes doesn't automatically enable the pointer cursor unless configured. Furthermore, small interactive elements (like slider tracks) need larger invisible hit areas to be accessible and easy to use.
**Action:** Always add an invisible, larger "hit area" rectangle/circle behind small UI elements and explicitly set `{ cursor: 'pointer' }` or `object.input.cursor = 'pointer'` for better affordance.

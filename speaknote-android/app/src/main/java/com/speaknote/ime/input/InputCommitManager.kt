package com.speaknote.ime.input

import android.inputmethodservice.InputMethodService
import android.view.KeyEvent

class InputCommitManager(private val service: InputMethodService) {

    fun commitText(text: String) {
        val ic = service.currentInputConnection ?: return
        ic.beginBatchEdit()
        ic.commitText(text, 1)
        ic.endBatchEdit()
    }

    fun deleteBackward() {
        service.currentInputConnection?.deleteSurroundingText(1, 0)
    }

    fun sendEnter() {
        service.currentInputConnection?.apply {
            sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
            sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER))
        }
    }

    /**
     * Toggle dakuten/handakuten on the last character.
     * あ→ぁ (small), か→が→か, は→ば→ぱ→は, etc.
     */
    fun toggleDakuten() {
        val ic = service.currentInputConnection ?: return
        val before = ic.getTextBeforeCursor(1, 0)?.toString() ?: return
        if (before.isEmpty()) return

        val ch = before[0]
        val converted = dakutenMap[ch] ?: smallMap[ch]
        if (converted != null) {
            ic.deleteSurroundingText(1, 0)
            ic.commitText(converted.toString(), 1)
        }
    }

    companion object {
        // Dakuten / Handakuten cycle map
        private val dakutenMap = mapOf(
            // Ka row
            'か' to 'が', 'が' to 'か',
            'き' to 'ぎ', 'ぎ' to 'き',
            'く' to 'ぐ', 'ぐ' to 'く',
            'け' to 'げ', 'げ' to 'け',
            'こ' to 'ご', 'ご' to 'こ',
            // Sa row
            'さ' to 'ざ', 'ざ' to 'さ',
            'し' to 'じ', 'じ' to 'し',
            'す' to 'ず', 'ず' to 'す',
            'せ' to 'ぜ', 'ぜ' to 'せ',
            'そ' to 'ぞ', 'ぞ' to 'そ',
            // Ta row
            'た' to 'だ', 'だ' to 'た',
            'ち' to 'ぢ', 'ぢ' to 'ち',
            'つ' to 'づ', 'づ' to 'つ',
            'て' to 'で', 'で' to 'て',
            'と' to 'ど', 'ど' to 'と',
            // Ha row (cycles: は→ば→ぱ→は)
            'は' to 'ば', 'ば' to 'ぱ', 'ぱ' to 'は',
            'ひ' to 'び', 'び' to 'ぴ', 'ぴ' to 'ひ',
            'ふ' to 'ぶ', 'ぶ' to 'ぷ', 'ぷ' to 'ふ',
            'へ' to 'べ', 'べ' to 'ぺ', 'ぺ' to 'へ',
            'ほ' to 'ぼ', 'ぼ' to 'ぽ', 'ぽ' to 'ほ',
            // Katakana Ka row
            'カ' to 'ガ', 'ガ' to 'カ',
            'キ' to 'ギ', 'ギ' to 'キ',
            'ク' to 'グ', 'グ' to 'ク',
            'ケ' to 'ゲ', 'ゲ' to 'ケ',
            'コ' to 'ゴ', 'ゴ' to 'コ',
            // Katakana Sa row
            'サ' to 'ザ', 'ザ' to 'サ',
            'シ' to 'ジ', 'ジ' to 'シ',
            'ス' to 'ズ', 'ズ' to 'ス',
            'セ' to 'ゼ', 'ゼ' to 'セ',
            'ソ' to 'ゾ', 'ゾ' to 'ソ',
            // Katakana Ta row
            'タ' to 'ダ', 'ダ' to 'タ',
            'チ' to 'ヂ', 'ヂ' to 'チ',
            'ツ' to 'ヅ', 'ヅ' to 'ツ',
            'テ' to 'デ', 'デ' to 'テ',
            'ト' to 'ド', 'ド' to 'ト',
            // Katakana Ha row
            'ハ' to 'バ', 'バ' to 'パ', 'パ' to 'ハ',
            'ヒ' to 'ビ', 'ビ' to 'ピ', 'ピ' to 'ヒ',
            'フ' to 'ブ', 'ブ' to 'プ', 'プ' to 'フ',
            'ヘ' to 'ベ', 'ベ' to 'ペ', 'ペ' to 'ヘ',
            'ホ' to 'ボ', 'ボ' to 'ポ', 'ポ' to 'ホ',
        )

        // Small kana toggle
        private val smallMap = mapOf(
            'あ' to 'ぁ', 'ぁ' to 'あ',
            'い' to 'ぃ', 'ぃ' to 'い',
            'う' to 'ぅ', 'ぅ' to 'う',
            'え' to 'ぇ', 'ぇ' to 'え',
            'お' to 'ぉ', 'ぉ' to 'お',
            'つ' to 'っ', 'っ' to 'つ',
            'や' to 'ゃ', 'ゃ' to 'や',
            'ゆ' to 'ゅ', 'ゅ' to 'ゆ',
            'よ' to 'ょ', 'ょ' to 'よ',
            'わ' to 'ゎ', 'ゎ' to 'わ',
            'ア' to 'ァ', 'ァ' to 'ア',
            'イ' to 'ィ', 'ィ' to 'イ',
            'ウ' to 'ゥ', 'ゥ' to 'ウ',
            'エ' to 'ェ', 'ェ' to 'エ',
            'オ' to 'ォ', 'ォ' to 'オ',
            'ツ' to 'ッ', 'ッ' to 'ツ',
            'ヤ' to 'ャ', 'ャ' to 'ヤ',
            'ユ' to 'ュ', 'ュ' to 'ユ',
            'ヨ' to 'ョ', 'ョ' to 'ヨ',
            'ワ' to 'ヮ', 'ヮ' to 'ワ',
        )
    }
}

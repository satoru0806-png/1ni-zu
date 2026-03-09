package com.speaknote.ime.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.View
import android.widget.*
import com.speaknote.ime.keyboard.KeyboardMode
import kotlin.math.abs
import kotlin.math.sqrt

@SuppressLint("ViewConstructor", "ClickableViewAccessibility")
class KeyboardPanel(context: Context) : LinearLayout(context) {

    var onKeyTap: ((String) -> Unit)? = null
    var onMicTap: (() -> Unit)? = null
    var onConvertTap: (() -> Unit)? = null
    var onCandidateSelected: ((String) -> Unit)? = null

    private val statusText: TextView
    private val keyboardArea: LinearLayout
    private val candidateBar: HorizontalScrollView
    private val candidateContainer: LinearLayout
    private var currentMode = KeyboardMode.HIRAGANA
    private var showKeyboard = false

    private var flickPopup: TextView? = null

    private val bgDark = Color.parseColor("#1a1a2e")
    private val bgKey = Color.parseColor("#2a2a4a")
    private val bgKeySpecial = Color.parseColor("#3a3a5a")
    private val bgCandidate = Color.parseColor("#222244")
    private val accentColor = Color.parseColor("#667eea")
    private val redColor = Color.parseColor("#e74c3c")
    private val greenColor = Color.parseColor("#27ae60")
    private val textColor = Color.parseColor("#eeeeee")

    private val flickThreshold = dp(30)

    private lateinit var voiceModeArea: LinearLayout
    private lateinit var micButtonLarge: ImageButton

    init {
        orientation = VERTICAL
        setBackgroundColor(bgDark)
        setPadding(dp(4), dp(4), dp(4), dp(70))

        // Candidate bar (hidden by default)
        candidateContainer = LinearLayout(context).apply {
            orientation = HORIZONTAL
            setPadding(dp(4), dp(2), dp(4), dp(2))
        }
        candidateBar = HorizontalScrollView(context).apply {
            addView(candidateContainer)
            isHorizontalScrollBarEnabled = false
            visibility = View.GONE
            setBackgroundColor(bgCandidate)
        }
        addView(candidateBar, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        // Status bar
        statusText = TextView(context).apply {
            text = "マイクをタップして音声入力"
            setTextColor(Color.parseColor("#888888"))
            textSize = 12f
            gravity = Gravity.CENTER
            setPadding(0, dp(4), 0, dp(2))
        }
        addView(statusText, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        // Voice mode area (default view)
        voiceModeArea = LinearLayout(context).apply {
            orientation = VERTICAL
        }
        buildVoiceMode()
        addView(voiceModeArea, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        // Keyboard area (hidden by default)
        keyboardArea = LinearLayout(context).apply {
            orientation = VERTICAL
            visibility = View.GONE
        }
        addView(keyboardArea, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    }

    /**
     * Voice mode layout:
     * ┌──────────┬─────────┬─────────┐
     * │          │  変換   │   ✕     │
     * │  マイク  ├─────────┼─────────┤
     * │          │ ⌨ 鍵盤  │  改行   │
     * ├──────────┴─────────┴─────────┤
     * │          AI切替               │
     * └──────────────────────────────┘
     */
    private fun buildVoiceMode() {
        voiceModeArea.removeAllViews()

        // Main row: mic + 2x2 grid
        val mainRow = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(12), dp(8), dp(4))
        }

        // Left: Large mic button
        micButtonLarge = ImageButton(context).apply {
            setImageResource(android.R.drawable.ic_btn_speak_now)
            background = createRoundDrawable(accentColor, dp(20))
            scaleType = ImageView.ScaleType.CENTER_INSIDE
            setOnClickListener {
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                onMicTap?.invoke()
            }
        }
        mainRow.addView(micButtonLarge, LayoutParams(0, dp(140), 1.2f).apply {
            marginEnd = dp(6)
        })

        // Right: 2x2 grid
        val rightGrid = LinearLayout(context).apply {
            orientation = VERTICAL
        }

        // Top row: 変換 + 削除(✕)
        val topRow = LinearLayout(context).apply {
            orientation = HORIZONTAL
        }
        val convertBtn = createVoiceButton("変換", greenColor, 15f).apply {
            setOnClickListener {
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                onConvertTap?.invoke()
            }
        }
        topRow.addView(convertBtn, LayoutParams(0, dp(68), 1f).apply {
            marginEnd = dp(3)
            bottomMargin = dp(3)
        })

        val delBtn = createVoiceButton("✕", bgKeySpecial, 20f).apply {
            setOnClickListener {
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                onKeyTap?.invoke("DEL")
            }
        }
        topRow.addView(delBtn, LayoutParams(0, dp(68), 1f).apply {
            bottomMargin = dp(3)
        })

        rightGrid.addView(topRow, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        // Bottom row: 鍵盤 + 改行
        val bottomRow = LinearLayout(context).apply {
            orientation = HORIZONTAL
        }
        val kbBtn = createVoiceButton("⌨ 鍵盤", bgKeySpecial, 13f).apply {
            setOnClickListener {
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                toggleKeyboardView()
            }
        }
        bottomRow.addView(kbBtn, LayoutParams(0, dp(68), 1f).apply {
            marginEnd = dp(3)
        })

        val enterBtn = createVoiceButton("改行", accentColor, 14f).apply {
            setOnClickListener {
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                onKeyTap?.invoke("ENTER")
            }
        }
        bottomRow.addView(enterBtn, LayoutParams(0, dp(68), 1f))

        rightGrid.addView(bottomRow, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        mainRow.addView(rightGrid, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        voiceModeArea.addView(mainRow, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        // Bottom: AI切替 button (full width, below mic)
        val aiRow = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(2), dp(8), dp(8))
        }
        val aiBtn = createVoiceButton("A切替", bgKeySpecial, 13f).apply {
            setOnClickListener {
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                toggleKeyboardView()
            }
        }
        aiRow.addView(aiBtn, LayoutParams(LayoutParams.MATCH_PARENT, dp(36)))
        voiceModeArea.addView(aiRow, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
    }

    fun showCandidates(candidates: List<String>) {
        candidateContainer.removeAllViews()
        if (candidates.isEmpty()) {
            candidateBar.visibility = View.GONE
            return
        }
        candidateBar.visibility = View.VISIBLE
        for ((idx, candidate) in candidates.withIndex()) {
            val tv = TextView(context).apply {
                text = candidate
                setTextColor(textColor)
                textSize = 16f
                gravity = Gravity.CENTER
                setPadding(dp(14), dp(8), dp(14), dp(8))
                background = createRoundDrawable(
                    if (idx == 0) accentColor else bgKeySpecial, dp(6)
                )
                isClickable = true
                isFocusable = true
                if (idx == 0) setTypeface(null, Typeface.BOLD)
                setOnClickListener {
                    performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                    onCandidateSelected?.invoke(candidate)
                }
            }
            candidateContainer.addView(tv, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
                marginEnd = dp(4)
            })
        }
        candidateBar.scrollTo(0, 0)
    }

    fun hideCandidates() {
        candidateBar.visibility = View.GONE
        candidateContainer.removeAllViews()
    }

    private fun createVoiceButton(text: String, bgColor: Int, size: Float): TextView {
        return TextView(context).apply {
            this.text = text
            setTextColor(if (bgColor == accentColor || bgColor == greenColor) Color.WHITE else textColor)
            textSize = size
            gravity = Gravity.CENTER
            background = createRoundDrawable(bgColor, dp(10))
            isClickable = true
            isFocusable = true
        }
    }

    private fun toggleKeyboardView() {
        showKeyboard = !showKeyboard
        if (showKeyboard) {
            keyboardArea.visibility = View.VISIBLE
            voiceModeArea.visibility = View.GONE
            buildFlickLayout()
        } else {
            keyboardArea.visibility = View.GONE
            voiceModeArea.visibility = View.VISIBLE
        }
    }

    fun showStatus(text: String) {
        statusText.text = text
    }

    fun setMicState(recording: Boolean) {
        val color = if (recording) redColor else accentColor
        micButtonLarge.background = createRoundDrawable(color, dp(20))
    }

    fun switchMode(mode: KeyboardMode) {
        currentMode = mode
        if (showKeyboard) buildFlickLayout()
    }

    // --- Flick keyboard ---

    private fun buildFlickLayout() {
        keyboardArea.removeAllViews()

        // Top bar: back + mode switch + convert
        val topBar = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(4), dp(2), dp(4), dp(2))
        }

        val backBtn = createToolButton("🎤 戻る", bgKeySpecial, textSize = 13f).apply {
            setOnClickListener {
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                toggleKeyboardView()
            }
        }
        topBar.addView(backBtn, LayoutParams(LayoutParams.WRAP_CONTENT, dp(38)).apply {
            marginEnd = dp(6)
        })

        val modeBtn = createToolButton(
            when (currentMode) {
                KeyboardMode.HIRAGANA -> "あ→ABC"
                KeyboardMode.ALPHABET -> "ABC→123"
                KeyboardMode.NUMBER -> "123→あ"
                else -> "あ→ABC"
            }, bgKeySpecial, textSize = 13f
        ).apply {
            setOnClickListener {
                currentMode = when (currentMode) {
                    KeyboardMode.HIRAGANA -> KeyboardMode.ALPHABET
                    KeyboardMode.ALPHABET -> KeyboardMode.NUMBER
                    KeyboardMode.NUMBER -> KeyboardMode.HIRAGANA
                    else -> KeyboardMode.HIRAGANA
                }
                buildFlickLayout()
            }
        }
        topBar.addView(modeBtn, LayoutParams(LayoutParams.WRAP_CONTENT, dp(38)).apply {
            marginEnd = dp(6)
        })

        // Convert button in flick mode too
        val convertBtn = createToolButton("変換", greenColor, textSize = 13f).apply {
            setOnClickListener {
                performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                onConvertTap?.invoke()
            }
        }
        topBar.addView(convertBtn, LayoutParams(LayoutParams.WRAP_CONTENT, dp(38)))

        keyboardArea.addView(topBar, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        // Flick keys
        val layout = when (currentMode) {
            KeyboardMode.HIRAGANA -> flickHiragana
            KeyboardMode.ALPHABET -> flickAlphabet
            KeyboardMode.NUMBER -> flickNumber
            else -> flickHiragana
        }

        for ((rowIdx, row) in layout.withIndex()) {
            val isLastRow = rowIdx == layout.size - 1
            val rowHeight = if (isLastRow) dp(58) else dp(54)
            val rowLayout = LinearLayout(context).apply {
                orientation = HORIZONTAL
                gravity = Gravity.CENTER
                setPadding(dp(2), dp(2), dp(2), dp(2))
            }
            for (key in row) {
                val view = createFlickKeyView(key)
                val weight = when (key.center) {
                    "SPACE" -> 2f
                    else -> 1f
                }
                rowLayout.addView(view, LayoutParams(0, rowHeight, weight).apply {
                    marginStart = dp(2)
                    marginEnd = dp(2)
                })
            }
            keyboardArea.addView(rowLayout, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
        }
    }

    private fun createToolButton(text: String, bgColor: Int, textSize: Float = 16f): TextView {
        return TextView(context).apply {
            this.text = text
            setTextColor(if (bgColor == greenColor) Color.WHITE else textColor)
            this.textSize = textSize
            gravity = Gravity.CENTER
            background = createRoundDrawable(bgColor, dp(8))
            setPadding(dp(14), dp(6), dp(14), dp(6))
            isClickable = true
            isFocusable = true
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun createFlickKeyView(key: FlickKey): View {
        val isSpecial = key.center in listOf("DEL", "ENTER", "SPACE", "゛゜", "⇧")
        val bgColor = when (key.center) {
            "ENTER" -> accentColor
            "DEL", "゛゜", "⇧" -> bgKeySpecial
            else -> bgKey
        }

        val displayText = when (key.center) {
            "DEL" -> "⌫"
            "ENTER" -> "改行"
            "SPACE" -> "␣"
            else -> key.center
        }

        val tv = TextView(context).apply {
            text = displayText
            setTextColor(if (key.center == "ENTER") Color.WHITE else textColor)
            textSize = if (isSpecial) 14f else 20f
            gravity = Gravity.CENTER
            background = createRoundDrawable(bgColor, dp(8))
            isClickable = true
            isFocusable = true
        }

        var startX = 0f
        var startY = 0f

        tv.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    startX = event.rawX
                    startY = event.rawY
                    v.isPressed = true
                    if (key.hasFlick()) showFlickPreview(v, key.center)
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    if (key.hasFlick()) {
                        val dx = event.rawX - startX
                        val dy = event.rawY - startY
                        val dist = sqrt(dx * dx + dy * dy)
                        if (dist > flickThreshold) {
                            val dir = getFlickDirection(dx, dy)
                            val ch = key.getByDirection(dir)
                            updateFlickPreview(ch ?: key.center)
                        } else {
                            updateFlickPreview(key.center)
                        }
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    v.isPressed = false
                    hideFlickPreview()
                    val dx = event.rawX - startX
                    val dy = event.rawY - startY
                    val dist = sqrt(dx * dx + dy * dy)

                    v.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)

                    if (dist > flickThreshold && key.hasFlick()) {
                        val dir = getFlickDirection(dx, dy)
                        val ch = key.getByDirection(dir)
                        onKeyTap?.invoke(ch ?: key.center)
                    } else {
                        onKeyTap?.invoke(key.center)
                    }
                    true
                }
                MotionEvent.ACTION_CANCEL -> {
                    v.isPressed = false
                    hideFlickPreview()
                    true
                }
                else -> false
            }
        }

        return tv
    }

    private fun showFlickPreview(anchor: View, text: String) {
        hideFlickPreview()
        val popup = TextView(context).apply {
            this.text = text
            textSize = 32f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(dp(20), dp(10), dp(20), dp(10))
            background = createRoundDrawable(Color.parseColor("#444466"), dp(10))
            elevation = dp(8).toFloat()
        }
        flickPopup = popup
        val parent = rootView as? FrameLayout ?: return
        val loc = IntArray(2)
        anchor.getLocationInWindow(loc)
        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            leftMargin = loc[0] + anchor.width / 2 - dp(30)
            topMargin = loc[1] - dp(55)
        }
        parent.addView(popup, params)
    }

    private fun updateFlickPreview(text: String) {
        flickPopup?.text = text
    }

    private fun hideFlickPreview() {
        flickPopup?.let { (it.parent as? FrameLayout)?.removeView(it) }
        flickPopup = null
    }

    private fun getFlickDirection(dx: Float, dy: Float): FlickDir {
        return if (abs(dx) > abs(dy)) {
            if (dx > 0) FlickDir.RIGHT else FlickDir.LEFT
        } else {
            if (dy > 0) FlickDir.DOWN else FlickDir.UP
        }
    }

    private fun createRoundDrawable(color: Int, radius: Int): GradientDrawable {
        return GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius.toFloat()
        }
    }

    private fun dp(value: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value.toFloat(),
            context.resources.displayMetrics
        ).toInt()
    }

    enum class FlickDir { LEFT, UP, RIGHT, DOWN }

    data class FlickKey(
        val center: String,
        val left: String? = null,
        val up: String? = null,
        val right: String? = null,
        val down: String? = null,
    ) {
        fun hasFlick(): Boolean = left != null || up != null || right != null || down != null
        fun getByDirection(dir: FlickDir): String? = when (dir) {
            FlickDir.LEFT -> left
            FlickDir.UP -> up
            FlickDir.RIGHT -> right
            FlickDir.DOWN -> down
        }
    }

    companion object {
        val flickHiragana = listOf(
            listOf(
                FlickKey("あ", left = "い", up = "う", right = "え", down = "お"),
                FlickKey("か", left = "き", up = "く", right = "け", down = "こ"),
                FlickKey("さ", left = "し", up = "す", right = "せ", down = "そ"),
            ),
            listOf(
                FlickKey("た", left = "ち", up = "つ", right = "て", down = "と"),
                FlickKey("な", left = "に", up = "ぬ", right = "ね", down = "の"),
                FlickKey("は", left = "ひ", up = "ふ", right = "へ", down = "ほ"),
            ),
            listOf(
                FlickKey("ま", left = "み", up = "む", right = "め", down = "も"),
                FlickKey("や", left = "（", up = "ゆ", right = "）", down = "よ"),
                FlickKey("ら", left = "り", up = "る", right = "れ", down = "ろ"),
            ),
            listOf(
                FlickKey("゛゜"),
                FlickKey("わ", left = "を", up = "ん", right = "ー", down = "〜"),
                FlickKey("SPACE"),
                FlickKey("DEL"),
                FlickKey("ENTER"),
            ),
        )

        val flickAlphabet = listOf(
            listOf(
                FlickKey("abc", left = "a", up = "b", right = "c"),
                FlickKey("def", left = "d", up = "e", right = "f"),
                FlickKey("ghi", left = "g", up = "h", right = "i"),
            ),
            listOf(
                FlickKey("jkl", left = "j", up = "k", right = "l"),
                FlickKey("mno", left = "m", up = "n", right = "o"),
                FlickKey("pqrs", left = "p", up = "q", right = "r", down = "s"),
            ),
            listOf(
                FlickKey("tuv", left = "t", up = "u", right = "v"),
                FlickKey("wxyz", left = "w", up = "x", right = "y", down = "z"),
                FlickKey("@#", left = "@", up = "#", right = "/", down = "."),
            ),
            listOf(
                FlickKey("⇧"),
                FlickKey(".,!?", left = ".", up = ",", right = "!", down = "?"),
                FlickKey("SPACE"),
                FlickKey("DEL"),
                FlickKey("ENTER"),
            ),
        )

        val flickNumber = listOf(
            listOf(FlickKey("1"), FlickKey("2"), FlickKey("3")),
            listOf(FlickKey("4"), FlickKey("5"), FlickKey("6")),
            listOf(FlickKey("7"), FlickKey("8"), FlickKey("9")),
            listOf(
                FlickKey("*", left = "#", up = "+", right = "-"),
                FlickKey("0"),
                FlickKey("SPACE"),
                FlickKey("DEL"),
                FlickKey("ENTER"),
            ),
        )
    }
}

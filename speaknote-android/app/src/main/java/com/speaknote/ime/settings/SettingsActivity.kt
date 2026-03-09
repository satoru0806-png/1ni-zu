package com.speaknote.ime.settings

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.*
import androidx.appcompat.app.AppCompatActivity

class SettingsActivity : AppCompatActivity() {

    private val bgDark = Color.parseColor("#1a1a2e")
    private val bgCard = Color.parseColor("#16213e")
    private val accentColor = Color.parseColor("#667eea")
    private val textColor = Color.parseColor("#eeeeee")
    private val subTextColor = Color.parseColor("#888888")
    private val greenColor = Color.parseColor("#27ae60")

    private lateinit var contentArea: FrameLayout
    private var activeTab = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(bgDark)
        }

        // Header
        root.addView(TextView(this).apply {
            text = "SpeakNote"
            textSize = 22f
            setTextColor(textColor)
            setTypeface(null, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(0, dp(24), 0, dp(8))
        })
        root.addView(TextView(this).apply {
            text = "音声入力キーボード"
            textSize = 12f
            setTextColor(subTextColor)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(12))
        })

        // Tab bar
        val tabBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(8), 0, dp(8), dp(8))
        }
        val tabs = listOf("設定", "ヘルプ", "履歴", "改善要求")
        for ((i, label) in tabs.withIndex()) {
            val tab = TextView(this).apply {
                text = label
                textSize = 13f
                setTextColor(if (i == 0) Color.WHITE else subTextColor)
                gravity = Gravity.CENTER
                setPadding(dp(12), dp(8), dp(12), dp(8))
                background = createRoundDrawable(if (i == 0) accentColor else Color.TRANSPARENT, dp(16))
                setOnClickListener { switchTab(i) }
                tag = "tab_$i"
            }
            tabBar.addView(tab, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = dp(2)
                marginEnd = dp(2)
            })
        }
        root.addView(tabBar)

        // Content area
        contentArea = FrameLayout(this)
        val scrollView = ScrollView(this).apply {
            addView(contentArea)
        }
        root.addView(scrollView, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
        ))

        setContentView(root)
        switchTab(0)
    }

    private fun switchTab(index: Int) {
        activeTab = index
        contentArea.removeAllViews()

        // Update tab styles
        for (i in 0..3) {
            val tab = window.decorView.findViewWithTag<TextView>("tab_$i") ?: continue
            tab.setTextColor(if (i == index) Color.WHITE else subTextColor)
            tab.background = createRoundDrawable(
                if (i == index) accentColor else Color.TRANSPARENT, dp(16)
            )
        }

        when (index) {
            0 -> showSettingsTab()
            1 -> showHelpTab()
            2 -> showHistoryTab()
            3 -> showFeedbackTab()
        }
    }

    // ========== Settings Tab ==========
    private fun showSettingsTab() {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(16), dp(20), dp(20))
        }

        layout.addView(createSectionTitle("セットアップ"))

        layout.addView(createStepCard("1", "キーボードを有効化",
            "SpeakNoteをキーボードとして使えるようにします") {
            startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS))
        })

        layout.addView(createStepCard("2", "SpeakNoteに切り替え",
            "入力方法をSpeakNoteに切り替えます") {
            val imm = getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager
            imm.showInputMethodPicker()
        })

        layout.addView(createStepCard("3", "マイク権限を許可",
            "音声入力に必要な権限を設定します") {
            startActivity(Intent(this, PermissionActivity::class.java))
        })

        layout.addView(TextView(this).apply {
            text = "✓ 準備完了！どのアプリでもSpeakNoteが使えます"
            textSize = 14f
            setTextColor(greenColor)
            setPadding(0, dp(20), 0, 0)
            gravity = Gravity.CENTER
        })

        contentArea.addView(layout)
    }

    // ========== Help Tab ==========
    private fun showHelpTab() {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(16), dp(20), dp(20))
        }

        layout.addView(createSectionTitle("使い方"))

        val helpItems = listOf(
            "🎤 音声入力" to "マイクボタンをタップして話すだけ。話した内容がテキストに変換されます。完了すると「ピッ」と音が鳴ります。",
            "⌨ 鍵盤（フリック入力）" to "鍵盤ボタンをタップするとフリック入力キーボードが表示されます。\n・タップ = あ段（あ、か、さ…）\n・左フリック = い段\n・上フリック = う段\n・右フリック = え段\n・下フリック = お段",
            "変換" to "ひらがなを入力後「変換」ボタンを押すと漢字候補が表示されます。候補をタップして確定。スペースキーでも変換できます。一度選んだ変換は学習され、次回から先頭に表示されます。",
            "゛゜ 濁点・半濁点" to "「゛゜」ボタンで直前の文字に濁点・半濁点をつけます。\n例: か→が、は→ば→ぱ",
            "✕ 削除" to "1文字ずつ削除します。変換中はひらがなバッファから削除されます。",
            "改行" to "改行を入力します。変換中は変換を確定してから改行します。",
            "A切替" to "ひらがな → ABC → 数字 の順にキーボードモードを切り替えます。",
        )

        for ((title, desc) in helpItems) {
            layout.addView(createHelpCard(title, desc))
        }

        layout.addView(createSectionTitle("Tips"))
        layout.addView(createHelpCard("音声が認識されない場合",
            "・マイク権限が許可されているか確認\n・インターネット接続を確認\n・静かな環境で話す\n・端末を口に近づける"))
        layout.addView(createHelpCard("変換候補が出ない場合",
            "・インターネット接続を確認（Google変換APIを使用）\n・ひらがなを入力してから変換ボタンを押す"))

        contentArea.addView(layout)
    }

    // ========== History Tab ==========
    private fun showHistoryTab() {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(16), dp(20), dp(20))
        }

        layout.addView(createSectionTitle("変換履歴"))

        // Search bar
        val searchBox = EditText(this).apply {
            hint = "検索..."
            textSize = 14f
            setTextColor(textColor)
            setHintTextColor(subTextColor)
            setPadding(dp(14), dp(10), dp(14), dp(10))
            background = createRoundDrawable(bgCard, dp(10))
            tag = "search"
        }
        layout.addView(searchBox, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = dp(12) })

        // History list container
        val listContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            tag = "historyList"
        }
        layout.addView(listContainer)

        // Load and display history
        val prefs = getSharedPreferences("speaknote_conversion", Context.MODE_PRIVATE)
        val allEntries = prefs.all.filter { it.key.startsWith("conv_") }
            .map { Pair(it.key.removePrefix("conv_"), it.value.toString()) }
            .sortedBy { it.first }

        fun renderList(filter: String = "") {
            listContainer.removeAllViews()
            val filtered = if (filter.isBlank()) allEntries
            else allEntries.filter {
                it.first.contains(filter) || it.second.contains(filter)
            }

            if (filtered.isEmpty()) {
                listContainer.addView(TextView(this@SettingsActivity).apply {
                    text = if (allEntries.isEmpty()) "まだ変換履歴がありません。\nキーボードで文字を変換すると\nここに表示されます。"
                    else "「$filter」に一致する履歴はありません"
                    textSize = 13f
                    setTextColor(subTextColor)
                    gravity = Gravity.CENTER
                    setPadding(0, dp(40), 0, 0)
                })
                return
            }

            listContainer.addView(TextView(this@SettingsActivity).apply {
                text = "${filtered.size}件の変換履歴"
                textSize = 11f
                setTextColor(subTextColor)
                setPadding(0, 0, 0, dp(8))
            })

            for ((hiragana, kanji) in filtered) {
                val row = LinearLayout(this@SettingsActivity).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER_VERTICAL
                    setPadding(dp(12), dp(10), dp(12), dp(10))
                    background = createRoundDrawable(bgCard, dp(8))
                }
                row.addView(TextView(this@SettingsActivity).apply {
                    text = hiragana
                    textSize = 15f
                    setTextColor(subTextColor)
                }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))

                row.addView(TextView(this@SettingsActivity).apply {
                    text = "→"
                    textSize = 14f
                    setTextColor(subTextColor)
                    setPadding(dp(8), 0, dp(8), 0)
                })

                row.addView(TextView(this@SettingsActivity).apply {
                    text = kanji
                    textSize = 15f
                    setTextColor(textColor)
                    setTypeface(null, Typeface.BOLD)
                }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))

                // Delete button
                row.addView(TextView(this@SettingsActivity).apply {
                    text = "✕"
                    textSize = 14f
                    setTextColor(Color.parseColor("#e74c3c"))
                    setPadding(dp(8), 0, 0, 0)
                    setOnClickListener {
                        prefs.edit().remove("conv_$hiragana").apply()
                        Toast.makeText(this@SettingsActivity, "「$hiragana→$kanji」を削除", Toast.LENGTH_SHORT).show()
                        // Refresh
                        switchTab(2)
                    }
                })

                listContainer.addView(row, LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = dp(4) })
            }
        }

        renderList()

        searchBox.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                renderList(s?.toString() ?: "")
            }
        })

        contentArea.addView(layout)
    }

    // ========== Feedback Tab ==========
    private fun showFeedbackTab() {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(16), dp(20), dp(20))
        }

        layout.addView(createSectionTitle("改善要求・フィードバック"))

        layout.addView(TextView(this).apply {
            text = "SpeakNoteをより良くするためのご意見をお聞かせください"
            textSize = 13f
            setTextColor(subTextColor)
            setPadding(0, 0, 0, dp(16))
        })

        // Category selector
        layout.addView(TextView(this).apply {
            text = "カテゴリ"
            textSize = 13f
            setTextColor(subTextColor)
            setPadding(0, 0, 0, dp(4))
        })

        val categories = arrayOf("バグ報告", "機能リクエスト", "使いにくい点", "その他")
        val spinner = Spinner(this).apply {
            adapter = ArrayAdapter(this@SettingsActivity, android.R.layout.simple_spinner_dropdown_item, categories)
            setPadding(dp(8), dp(4), dp(8), dp(4))
            background = createRoundDrawable(bgCard, dp(8))
        }
        layout.addView(spinner, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = dp(12) })

        // Text input
        layout.addView(TextView(this).apply {
            text = "内容"
            textSize = 13f
            setTextColor(subTextColor)
            setPadding(0, 0, 0, dp(4))
        })

        val feedbackInput = EditText(this).apply {
            hint = "改善してほしい内容を入力..."
            textSize = 14f
            setTextColor(textColor)
            setHintTextColor(subTextColor)
            minLines = 5
            gravity = Gravity.TOP
            setPadding(dp(14), dp(10), dp(14), dp(10))
            background = createRoundDrawable(bgCard, dp(10))
        }
        layout.addView(feedbackInput, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = dp(16) })

        // Submit button
        val submitBtn = Button(this).apply {
            text = "送信"
            textSize = 15f
            setTextColor(Color.WHITE)
            background = createRoundDrawable(accentColor, dp(10))
            setOnClickListener {
                val category = spinner.selectedItem.toString()
                val content = feedbackInput.text.toString().trim()
                if (content.isEmpty()) {
                    Toast.makeText(this@SettingsActivity, "内容を入力してください", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }

                // Save feedback locally
                val prefs = getSharedPreferences("speaknote_feedback", Context.MODE_PRIVATE)
                val count = prefs.getInt("count", 0)
                prefs.edit()
                    .putString("fb_${count}_category", category)
                    .putString("fb_${count}_content", content)
                    .putLong("fb_${count}_time", System.currentTimeMillis())
                    .putInt("count", count + 1)
                    .apply()

                feedbackInput.text.clear()
                Toast.makeText(this@SettingsActivity, "フィードバックを保存しました。ありがとうございます！", Toast.LENGTH_LONG).show()
            }
        }
        layout.addView(submitBtn, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, dp(48)
        ).apply { bottomMargin = dp(20) })

        // Past feedback list
        layout.addView(createSectionTitle("過去のフィードバック"))

        val prefs = getSharedPreferences("speaknote_feedback", Context.MODE_PRIVATE)
        val count = prefs.getInt("count", 0)

        if (count == 0) {
            layout.addView(TextView(this).apply {
                text = "まだフィードバックはありません"
                textSize = 13f
                setTextColor(subTextColor)
                gravity = Gravity.CENTER
                setPadding(0, dp(20), 0, 0)
            })
        } else {
            for (i in count - 1 downTo maxOf(0, count - 20)) {
                val cat = prefs.getString("fb_${i}_category", "") ?: ""
                val cont = prefs.getString("fb_${i}_content", "") ?: ""
                val time = prefs.getLong("fb_${i}_time", 0)
                val dateStr = java.text.SimpleDateFormat("yyyy/MM/dd HH:mm", java.util.Locale.JAPAN)
                    .format(java.util.Date(time))

                val card = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dp(12), dp(10), dp(12), dp(10))
                    background = createRoundDrawable(bgCard, dp(8))
                }
                card.addView(LinearLayout(this).apply {
                    orientation = LinearLayout.HORIZONTAL
                    addView(TextView(this@SettingsActivity).apply {
                        text = cat
                        textSize = 11f
                        setTextColor(accentColor)
                        setPadding(dp(8), dp(2), dp(8), dp(2))
                        background = createRoundDrawable(Color.parseColor("#1e2d50"), dp(8))
                    })
                    addView(TextView(this@SettingsActivity).apply {
                        text = dateStr
                        textSize = 10f
                        setTextColor(subTextColor)
                        setPadding(dp(8), dp(2), 0, dp(2))
                    })
                })
                card.addView(TextView(this).apply {
                    text = cont
                    textSize = 13f
                    setTextColor(textColor)
                    setPadding(0, dp(6), 0, 0)
                })

                layout.addView(card, LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { bottomMargin = dp(6) })
            }
        }

        contentArea.addView(layout)
    }

    // ========== UI Helpers ==========

    private fun createSectionTitle(text: String): TextView {
        return TextView(this).apply {
            this.text = text
            textSize = 16f
            setTextColor(textColor)
            setTypeface(null, Typeface.BOLD)
            setPadding(0, dp(8), 0, dp(12))
        }
    }

    private fun createStepCard(step: String, title: String, desc: String, onClick: () -> Unit): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(14), dp(14), dp(14), dp(14))
            background = createRoundDrawable(bgCard, dp(10))
            isClickable = true
            isFocusable = true
            setOnClickListener { onClick() }

            // Step number
            addView(TextView(this@SettingsActivity).apply {
                this.text = step
                textSize = 18f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                val size = dp(36)
                background = createRoundDrawable(accentColor, dp(18))
                layoutParams = LinearLayout.LayoutParams(size, size).apply { marginEnd = dp(14) }
            })

            // Text
            val textLayout = LinearLayout(this@SettingsActivity).apply {
                orientation = LinearLayout.VERTICAL
            }
            textLayout.addView(TextView(this@SettingsActivity).apply {
                this.text = title
                textSize = 15f
                setTextColor(textColor)
            })
            textLayout.addView(TextView(this@SettingsActivity).apply {
                this.text = desc
                textSize = 11f
                setTextColor(subTextColor)
            })
            addView(textLayout, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))

            addView(TextView(this@SettingsActivity).apply {
                this.text = "→"
                textSize = 16f
                setTextColor(subTextColor)
            })
        }.also {
            (it.layoutParams as? LinearLayout.LayoutParams)?.bottomMargin = dp(8)
        }.apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = dp(8) }
        }
    }

    private fun createHelpCard(title: String, desc: String): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(14), dp(12), dp(14), dp(12))
            background = createRoundDrawable(bgCard, dp(10))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = dp(8) }

            addView(TextView(this@SettingsActivity).apply {
                text = title
                textSize = 14f
                setTextColor(textColor)
                setTypeface(null, Typeface.BOLD)
                setPadding(0, 0, 0, dp(4))
            })
            addView(TextView(this@SettingsActivity).apply {
                text = desc
                textSize = 12f
                setTextColor(subTextColor)
                setLineSpacing(4f, 1f)
            })
        }
    }

    private fun createRoundDrawable(color: Int, radius: Int): GradientDrawable {
        return GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius.toFloat()
        }
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }
}

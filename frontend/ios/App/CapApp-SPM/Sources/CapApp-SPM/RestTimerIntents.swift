import AppIntents
import AudioToolbox

/// 主 App 侧的 AppIntent 真实实现。
/// 遵循 LiveActivityIntent 协议，系统会在「主 App 进程」静默执行
/// （不打开 App、不打开 UI），因此可以访问 TimerEngine.shared。

@available(iOS 17.0, *)
struct ExtendRestIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Extend Rest"
    static var description = IntentDescription("Add seconds to the rest timer.")

    @Parameter(title: "Exercise ID")
    var exerciseId: String

    @Parameter(title: "Seconds")
    var seconds: Int

    init() {}

    init(exerciseId: String, seconds: Int) {
        self.exerciseId = exerciseId
        self.seconds = seconds
    }

    func perform() async throws -> some IntentResult {
        TimerEngine.shared.extendRest(exerciseId: exerciseId, bySeconds: Double(seconds))
        return .result()
    }
}

@available(iOS 17.0, *)
struct FinishRestIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Finish Rest"
    static var description = IntentDescription("Finish the rest timer.")

    @Parameter(title: "Exercise ID")
    var exerciseId: String

    init() {}

    init(exerciseId: String) {
        self.exerciseId = exerciseId
    }

    func perform() async throws -> some IntentResult {
        TimerEngine.shared.finishRest(exerciseId: exerciseId)
        // 振动反馈（保持锁屏，不打开 App）
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        return .result()
    }
}

import AppIntents

/// Widget Extension 侧的 AppIntent 占位定义。
/// 系统通过 LiveActivityIntent 协议，会在「主 App 进程」执行真实逻辑
/// （见 CapApp-SPM/RestTimerIntents.swift），这里的 perform() 不会被调用。

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
        // 占位：真实逻辑在主 App 进程执行
        .result()
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
        // 占位：真实逻辑在主 App 进程执行
        .result()
    }
}

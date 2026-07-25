import * as Haptics from "expo-haptics";

// 端末が振動に対応していない／権限がない場合は静かに何もしない。
// 触覚は「できたら気持ちいい」程度の演出なので、失敗しても操作は止めない。
function safely(run: () => Promise<unknown>): void {
  void run().catch(() => {});
}

// シールを貼る・コピーするなど、ものが増えたときの軽いトン。
export function tapFeedback(): void {
  safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

// 工程にチェックが付いたときの「できた！」。
export function successFeedback(): void {
  safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

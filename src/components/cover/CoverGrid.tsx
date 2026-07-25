import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { notebookDisplayName } from "@/lib/model";
import { colors, radii, shadows, space, text } from "@/lib/theme";
import type { Notebook } from "@/lib/types";
import { IconButton } from "@/components/ui/kit";
import { COVER_ASPECT, CoverArt } from "./CoverArt";

const ACTION_BAR_HEIGHT = 36;

// 表紙が順に浮かび上がる演出。冊数が増えても待たされないよう、ずらす段数に
// 上限を設ける（100冊あっても最後まで 0.36 秒で出そろう）。
const STAGGER_MS = 45;
const STAGGER_MAX_STEPS = 8;

function enterDelay(index: number): number {
  return Math.min(index, STAGGER_MAX_STEPS) * STAGGER_MS;
}

function CoverCard({
  notebook,
  index,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  notebook: Notebook;
  index: number;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const name = notebookDisplayName(notebook);

  return (
    <Animated.View style={styles.cell} entering={FadeInDown.delay(enterDelay(index)).duration(260)}>
      {/* カードの外枠は押せない容れ物にして、「開く」と操作ボタンを兄弟に並べる。
          押せる要素を入れ子にすると TalkBack が外側だけをひとかたまりで拾い、
          名前の変更・コピー・削除に降りられなくなるため（BoardTabs と同じ扱い）。 */}
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.opener, pressed && styles.cardPressed]}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${name}を開く`}
        >
          <CoverArt
            name={name}
            type={notebook.type}
            color={notebook.color}
            pageCount={notebook.pages.length}
            bottomInset={ACTION_BAR_HEIGHT}
          />
        </Pressable>
        <View style={styles.actions}>
          <IconButton icon="✏️" label={`${name}の名前を変える`} size={28} onPress={onRename} />
          <IconButton icon="📄" label={`${name}をコピー`} size={28} onPress={onDuplicate} />
          <IconButton icon="✕" label={`${name}を削除`} size={28} tone="rose" onPress={onDelete} />
        </View>
      </View>
    </Animated.View>
  );
}

export function CoverGrid({
  notebooks,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onAdd,
}: {
  notebooks: Notebook[];
  onOpen: (id: string) => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.grid}>
      {notebooks.map((nb, index) => (
        <CoverCard
          key={nb.id}
          notebook={nb}
          index={index}
          onOpen={() => onOpen(nb.id)}
          onRename={() => onRename(nb.id)}
          onDuplicate={() => onDuplicate(nb.id)}
          onDelete={() => onDelete(nb.id)}
        />
      ))}

      <Animated.View style={styles.cell} entering={FadeInDown.delay(enterDelay(notebooks.length)).duration(260)}>
        <Pressable
          style={({ pressed }) => [styles.addCard, pressed && styles.cardPressed]}
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="新しい手帳をつくる"
        >
          <Text style={styles.addPlus}>＋</Text>
          <Text style={styles.addLabel}>新しい手帳</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.lg,
  },
  cell: {
    width: "47%",
    flexGrow: 1,
    aspectRatio: COVER_ASPECT,
  },
  card: {
    flex: 1,
    borderRadius: radii.card,
    overflow: "hidden",
    boxShadow: shadows.raised,
  },
  // 表紙ぜんぶが「開く」の当たり判定。ボタン帯は上に重なるのでそちらが優先される。
  opener: {
    flex: 1,
  },
  cardPressed: {
    opacity: 0.9,
  },
  actions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: ACTION_BAR_HEIGHT,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: space.xs,
    paddingHorizontal: space.sm,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  addCard: {
    flex: 1,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: colors.dashedStrong,
    borderStyle: "dashed",
    backgroundColor: colors.veilWeak,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
  addPlus: {
    fontSize: 26,
    lineHeight: 32,
    color: colors.lavenderDeep,
  },
  addLabel: {
    ...text.label,
    color: colors.lavenderDeep,
  },
});

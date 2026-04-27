import { InvitationScreen } from "@/components/auth/invitation-screen"

export default function InvitationPage(props) {
  return <InvitationScreen token={props?.params?.token ?? ""} />
}

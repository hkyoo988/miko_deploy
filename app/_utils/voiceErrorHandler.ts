// utils/errorHandler.ts
export function handleMicrophoneError(err: any, setError: (error: string | null) => void) {
    switch (err.name) {
      case "NotAllowedError":
        setError("마이크 접근이 거부되었습니다. 설정에서 마이크 접근을 허용해주세요.");
        break;
      case "NotFoundError":
        setError("마이크가 감지되지 않았습니다. 마이크가 연결되어 있는지 확인해주세요.");
        break;
      case "NotReadableError":
        setError("마이크를 사용할 수 없습니다. 다른 프로그램에서 사용 중인지 확인해주세요.");
        break;
      case "OverconstrainedError":
        setError("요구된 오디오 제약 조건을 만족시키는 장치를 찾을 수 없습니다.");
        break;
      case "SecurityError":
        setError("보안 오류로 인해 마이크 접근이 차단되었습니다.");
        break;
      case "AbortError":
        setError("마이크 요청이 중단되었습니다. 다시 시도해주세요.");
        break;
      default:
        setError(`알 수 없는 오류가 발생했습니다: ${err.message}`);
        break;
    }
  }
  
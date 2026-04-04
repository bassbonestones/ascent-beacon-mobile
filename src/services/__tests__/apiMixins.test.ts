import {
  assistantMethods,
  recommendationsMethods,
  discoveryMethods,
} from "../apiMixins";
import type { ApiRequestOptions } from "../../types";

describe("apiMixins", () => {
  // Create a mock base class with proper typing
  class MockBase {
    request: jest.Mock<Promise<unknown>, [string, ApiRequestOptions?]> =
      jest.fn();
  }

  describe("assistantMethods", () => {
    // @ts-expect-error - MockBase is a test mock that doesn't extend ApiServiceBase
    const MixedClass = assistantMethods(MockBase);
    let api: InstanceType<typeof MixedClass>;

    beforeEach(() => {
      api = new MixedClass();
      jest.clearAllMocks();
    });

    describe("createAssistantSession", () => {
      it("should call request with POST and null context_mode by default", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({ session_id: "s1" });
        await api.createAssistantSession();
        expect(api.request).toHaveBeenCalledWith("/assistant/sessions", {
          method: "POST",
          body: JSON.stringify({ context_mode: null }),
        });
      });

      it("should pass context_mode when provided", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({ session_id: "s1" });
        await api.createAssistantSession("discovery");
        expect(api.request).toHaveBeenCalledWith("/assistant/sessions", {
          method: "POST",
          body: JSON.stringify({ context_mode: "discovery" }),
        });
      });
    });

    describe("getAssistantSession", () => {
      it("should call request with correct endpoint", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({ session: {} });
        await api.getAssistantSession("s1");
        expect(api.request).toHaveBeenCalledWith("/assistant/sessions/s1");
      });
    });

    describe("sendMessage", () => {
      it("should call request with POST and message content", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({ response: "Hello" });
        await api.sendMessage("s1", "Hi there");
        expect(api.request).toHaveBeenCalledWith(
          "/assistant/sessions/s1/message",
          {
            method: "POST",
            body: JSON.stringify({
              content: "Hi there",
              input_modality: "text",
            }),
          },
        );
      });

      it("should pass custom input_modality", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({ response: "Hello" });
        await api.sendMessage("s1", "audio content", "audio");
        expect(api.request).toHaveBeenCalledWith(
          "/assistant/sessions/s1/message",
          {
            method: "POST",
            body: JSON.stringify({
              content: "audio content",
              input_modality: "audio",
            }),
          },
        );
      });
    });

    describe("transcribeAudio", () => {
      it("should call request with FormData", async () => {
        const mockBlob = new Blob(["audio data"]);
        (api.request as jest.Mock).mockResolvedValueOnce({
          text: "transcribed",
        });
        await api.transcribeAudio(mockBlob, "test.m4a");
        expect(api.request).toHaveBeenCalledWith(
          "/voice/stt",
          expect.objectContaining({
            method: "POST",
            headers: {},
          }),
        );
      });
    });
  });

  describe("recommendationsMethods", () => {
    // @ts-expect-error - MockBase is a test mock that doesn't extend ApiServiceBase
    const MixedClass = recommendationsMethods(MockBase);
    let api: InstanceType<typeof MixedClass>;

    beforeEach(() => {
      api = new MixedClass();
      jest.clearAllMocks();
    });

    describe("getPendingRecommendations", () => {
      it("should call request with correct endpoint", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({
          recommendations: [],
        });
        await api.getPendingRecommendations();
        expect(api.request).toHaveBeenCalledWith("/recommendations/pending");
      });
    });

    describe("getSessionRecommendations", () => {
      it("should call request with session id", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({
          recommendations: [],
        });
        await api.getSessionRecommendations("s1");
        expect(api.request).toHaveBeenCalledWith("/recommendations/session/s1");
      });
    });

    describe("acceptRecommendation", () => {
      it("should call request with POST to accept endpoint", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce(undefined);
        await api.acceptRecommendation("rec1");
        expect(api.request).toHaveBeenCalledWith(
          "/recommendations/rec1/accept",
          {
            method: "POST",
            body: JSON.stringify({}),
          },
        );
      });
    });

    describe("rejectRecommendation", () => {
      it("should call request with POST to reject endpoint", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce(undefined);
        await api.rejectRecommendation("rec1");
        expect(api.request).toHaveBeenCalledWith(
          "/recommendations/rec1/reject",
          {
            method: "POST",
            body: JSON.stringify({ reason: null }),
          },
        );
      });

      it("should pass reason when provided", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce(undefined);
        await api.rejectRecommendation("rec1", "Not relevant");
        expect(api.request).toHaveBeenCalledWith(
          "/recommendations/rec1/reject",
          {
            method: "POST",
            body: JSON.stringify({ reason: "Not relevant" }),
          },
        );
      });
    });
  });

  describe("discoveryMethods", () => {
    // @ts-expect-error - MockBase is a test mock that doesn't extend ApiServiceBase
    const MixedClass = discoveryMethods(MockBase);
    let api: InstanceType<typeof MixedClass>;

    beforeEach(() => {
      api = new MixedClass();
      jest.clearAllMocks();
    });

    describe("getDiscoveryPrompts", () => {
      it("should call request with correct endpoint", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({ prompts: [] });
        await api.getDiscoveryPrompts();
        expect(api.request).toHaveBeenCalledWith("/discovery/prompts");
      });
    });

    describe("getUserSelections", () => {
      it("should call request with correct endpoint", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({ selections: [] });
        await api.getUserSelections();
        expect(api.request).toHaveBeenCalledWith("/discovery/selections");
      });
    });

    describe("createSelection", () => {
      it("should call request with POST and selection data", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({ id: "sel1" });
        await api.createSelection("prompt1");
        expect(api.request).toHaveBeenCalledWith("/discovery/selections", {
          method: "POST",
          body: JSON.stringify({
            prompt_id: "prompt1",
            bucket: "important",
            display_order: 0,
            custom_text: null,
          }),
        });
      });

      it("should pass custom parameters when provided", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce({ id: "sel1" });
        await api.createSelection("p1", "core", 5, "Custom text");
        expect(api.request).toHaveBeenCalledWith("/discovery/selections", {
          method: "POST",
          body: JSON.stringify({
            prompt_id: "p1",
            bucket: "core",
            display_order: 5,
            custom_text: "Custom text",
          }),
        });
      });
    });

    describe("updateSelection", () => {
      it("should call request with PUT and update data", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce(undefined);
        await api.updateSelection("sel1", "not_now", 2);
        expect(api.request).toHaveBeenCalledWith("/discovery/selections/sel1", {
          method: "PUT",
          body: JSON.stringify({ bucket: "not_now", display_order: 2 }),
        });
      });
    });

    describe("deleteSelection", () => {
      it("should call request with DELETE method", async () => {
        (api.request as jest.Mock).mockResolvedValueOnce(undefined);
        await api.deleteSelection("sel1");
        expect(api.request).toHaveBeenCalledWith("/discovery/selections/sel1", {
          method: "DELETE",
        });
      });
    });

    describe("bulkUpdateSelections", () => {
      it("should call request with POST and selections array", async () => {
        const selections = [
          { prompt_id: "s1", bucket: "important" as const, display_order: 0 },
          { prompt_id: "s2", bucket: "core" as const, display_order: 1 },
        ];
        (api.request as jest.Mock).mockResolvedValueOnce(undefined);
        await api.bulkUpdateSelections(selections);
        expect(api.request).toHaveBeenCalledWith("/discovery/selections/bulk", {
          method: "POST",
          body: JSON.stringify({ selections }),
        });
      });
    });
  });
});
